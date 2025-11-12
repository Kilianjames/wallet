import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Phantom provider
  useEffect(() => {
    const detectPhantom = () => {
      // Check multiple times for Phantom (it may load after page load)
      const checkForPhantom = () => {
        const phantom = window?.phantom?.solana;
        
        if (phantom?.isPhantom) {
          console.log('✅ Phantom wallet detected');
          setProvider(phantom);
          setIsReady(true);
          
          // Check if already connected
          if (phantom.isConnected && phantom.publicKey) {
            setPublicKey(phantom.publicKey.toString());
            setIsConnected(true);
            console.log('✅ Wallet already connected:', phantom.publicKey.toString());
          }

          // Listen for account changes
          phantom.on('connect', (pubKey) => {
            console.log('✅ Wallet connected:', pubKey.toString());
            setPublicKey(pubKey.toString());
            setIsConnected(true);
            setIsConnecting(false);
          });

          phantom.on('disconnect', () => {
            console.log('⚠️ Wallet disconnected');
            setPublicKey(null);
            setIsConnected(false);
          });

          phantom.on('accountChanged', (pubKey) => {
            if (pubKey) {
              console.log('✅ Account changed:', pubKey.toString());
              setPublicKey(pubKey.toString());
            } else {
              console.log('⚠️ Account disconnected');
              setPublicKey(null);
              setIsConnected(false);
            }
          });
          
          return true;
        }
        return false;
      };

      // Try immediately
      if (checkForPhantom()) return;

      // If not found, try again after short delays
      const timeouts = [100, 500, 1000, 2000].map(delay => 
        setTimeout(() => {
          if (checkForPhantom()) {
            // Found it!
          } else {
            console.warn(`⚠️ Phantom not found after ${delay}ms`);
          }
        }, delay)
      );

      // Set error and ready state after all attempts
      setTimeout(() => {
        if (!window?.phantom?.solana?.isPhantom) {
          setError('Phantom wallet not installed. Please install from https://phantom.app');
          console.error('❌ Phantom wallet not detected');
        }
        // Set ready anyway so UI doesn't stay stuck
        setIsReady(true);
      }, 2500);

      // Cleanup timeouts
      return () => timeouts.forEach(clearTimeout);
    };

    const cleanup = detectPhantom();

    // Cleanup
    return () => {
      if (cleanup) cleanup();
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, []);

  const connect = async () => {
    if (!provider) {
      const errorMsg = 'Phantom wallet not installed. Please install from https://phantom.app';
      setError(errorMsg);
      // Open Phantom download page
      window.open('https://phantom.app/download', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔗 Requesting wallet connection...');
      
      // Request connection with options
      const response = await provider.connect({ onlyIfTrusted: false });
      
      if (!response?.publicKey) {
        throw new Error('No public key returned from Phantom');
      }
      
      const pubKeyString = response.publicKey.toString();
      console.log('✅ Connected successfully:', pubKeyString);
      
      setPublicKey(pubKeyString);
      setIsConnected(true);
      localStorage.setItem('phantom_connected', 'true');
      localStorage.setItem('phantom_pubkey', pubKeyString);
    } catch (err) {
      console.error('❌ Connection error:', err);
      
      // Provide helpful error messages
      if (err?.message?.includes('User rejected')) {
        setError('Connection cancelled. Please try again.');
      } else if (err?.code === 4001) {
        setError('Connection request rejected by user.');
      } else {
        setError(err?.message || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setPublicKey(null);
      setIsConnected(false);
      localStorage.removeItem('phantom_connected');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const signAndSendTransaction = async (recipientAddress, amountSOL) => {
    if (!provider || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Use multiple RPC endpoints for better reliability
      const RPC_ENDPOINTS = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-rpc.publicnode.com',
        'https://solana.api.onfinality.io/public',
        'https://public.rpc.solanavibestation.com',
        'https://solana-api.projectserum.com'
      ];

      let connection = null;
      let blockhash = null;
      let lastValidBlockHeight = null;

      // Try multiple RPC endpoints
      for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
        const endpoint = RPC_ENDPOINTS[i];
        try {
          console.log(`[${i + 1}/${RPC_ENDPOINTS.length}] Attempting: ${endpoint}`);
          
          connection = new Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 90000,
            disableRetryOnRateLimit: false
          });

          // Test connection with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          );
          
          const blockhashPromise = connection.getLatestBlockhash('confirmed');
          
          const blockHashInfo = await Promise.race([blockhashPromise, timeoutPromise]);
          blockhash = blockHashInfo.blockhash;
          lastValidBlockHeight = blockHashInfo.lastValidBlockHeight;
          
          console.log(`✅ Connected to: ${endpoint}`);
          console.log(`✅ Got blockhash: ${blockhash.slice(0, 8)}...`);
          break;
        } catch (rpcError) {
          console.warn(`❌ Failed ${endpoint}: ${rpcError.message}`);
          if (i === RPC_ENDPOINTS.length - 1) {
            throw new Error('Unable to connect to Solana network. All RPC endpoints failed. Please check your internet connection and try again.');
          }
          continue;
        }
      }

      if (!blockhash || !connection) {
        throw new Error('Unable to connect to Solana network. Please try again.');
      }

      // Validate recipient address
      let recipientPubkey;
      try {
        recipientPubkey = new PublicKey(recipientAddress);
      } catch (err) {
        throw new Error('Invalid recipient address');
      }

      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(publicKey),
        toPubkey: recipientPubkey,
        lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
      });

      // Create V0 message (VersionedTransaction)
      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(publicKey),
        recentBlockhash: blockhash,
        instructions: [transferInstruction],
      }).compileToV0Message();

      // Create the VersionedTransaction
      const transaction = new VersionedTransaction(messageV0);

      console.log('📝 VersionedTransaction created, requesting signature from Phantom...');

      // Sign and send transaction via Phantom (returns signature directly)
      const signature = await provider.signAndSendTransaction(transaction);
      
      console.log('✅ Transaction signed and sent:', signature);

      // The signature returned from signAndSendTransaction can be either:
      // - A string (signature)
      // - An object with { signature: string }
      const txSignature = typeof signature === 'string' ? signature : signature.signature;

      // Wait for confirmation with retry logic
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!confirmed && attempts < maxAttempts) {
        try {
          const confirmation = await connection.confirmTransaction(
            {
              signature: txSignature,
              blockhash,
              lastValidBlockHeight,
            },
            'confirmed'
          );

          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
          }

          confirmed = true;
          console.log('✅ Transaction confirmed!');
        } catch (confirmError) {
          attempts++;
          if (attempts >= maxAttempts) {
            // Return success anyway - transaction was sent
            console.warn('⚠️ Confirmation timeout, but transaction was sent');
            return { signature: txSignature, success: true };
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return { signature: txSignature, success: true };
    } catch (err) {
      console.error('❌ Transaction error:', err);
      
      // Provide more helpful error messages
      if (err.message?.includes('User rejected')) {
        throw new Error('Transaction cancelled by user');
      } else if (err.message?.includes('insufficient')) {
        throw new Error('Insufficient SOL balance for this transaction');
      } else if (err.message?.includes('blockhash')) {
        throw new Error('Network connection issue. Please try again.');
      }
      
      throw err;
    }
  };

  const value = {
    provider,
    publicKey,
    address: publicKey,
    isConnected,
    isConnecting,
    isReady,
    error,
    connect,
    disconnect,
    signAndSendTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
