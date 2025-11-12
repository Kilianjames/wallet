import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

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

  // Initialize Phantom provider
  useEffect(() => {
    const detectPhantom = () => {
      const phantom = window?.phantom?.solana;
      
      if (phantom?.isPhantom) {
        setProvider(phantom);
        
        // Check if already connected
        if (phantom.isConnected && phantom.publicKey) {
          setPublicKey(phantom.publicKey.toString());
          setIsConnected(true);
        }

        // Listen for account changes
        phantom.on('connect', (pubKey) => {
          setPublicKey(pubKey.toString());
          setIsConnected(true);
          setIsConnecting(false);
        });

        phantom.on('disconnect', () => {
          setPublicKey(null);
          setIsConnected(false);
        });

        phantom.on('accountChanged', (pubKey) => {
          if (pubKey) {
            setPublicKey(pubKey.toString());
          } else {
            setPublicKey(null);
            setIsConnected(false);
          }
        });
      } else {
        setError('Phantom wallet not installed');
      }
    };

    detectPhantom();

    // Cleanup
    return () => {
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, []);

  const connect = async () => {
    if (!provider) {
      setError('Phantom wallet not installed. Please install from https://phantom.app');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await provider.connect();
      const pubKeyString = response.publicKey.toString();
      setPublicKey(pubKeyString);
      setIsConnected(true);
      localStorage.setItem('phantom_connected', 'true');
    } catch (err) {
      setError(err?.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
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
        'https://mainnet.helius-rpc.com/?api-key=public',
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com'
      ];

      let connection = null;
      let blockhash = null;
      let lastValidBlockHeight = null;

      // Try multiple RPC endpoints
      for (const endpoint of RPC_ENDPOINTS) {
        try {
          console.log(`Attempting connection to: ${endpoint}`);
          connection = new Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
          });

          // Test connection and get blockhash
          const blockHashInfo = await connection.getLatestBlockhash('confirmed');
          blockhash = blockHashInfo.blockhash;
          lastValidBlockHeight = blockHashInfo.lastValidBlockHeight;
          
          console.log('✅ Successfully connected to RPC and got blockhash');
          break;
        } catch (rpcError) {
          console.warn(`Failed to connect to ${endpoint}:`, rpcError.message);
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
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(publicKey),
      }).add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: recipientPubkey,
          lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
        })
      );

      console.log('📝 Transaction created, requesting signature from Phantom...');

      // Sign and send transaction via Phantom
      const { signature } = await provider.signAndSendTransaction(transaction);
      
      console.log('✅ Transaction signed and sent:', signature);

      // Wait for confirmation with retry logic
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!confirmed && attempts < maxAttempts) {
        try {
          const confirmation = await connection.confirmTransaction(
            {
              signature,
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
            throw new Error('Transaction confirmation timeout. The transaction may still succeed.');
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return { signature, success: true };
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
    isReady: !!provider,
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
