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
      // Connect to Solana mainnet
      const connection = new Connection(
        'https://api.mainnet-beta.solana.com',
        'confirmed'
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

      // Create transfer instruction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(publicKey),
      }).add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(recipientAddress),
          lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
        })
      );

      // Sign and send transaction via Phantom
      const { signature } = await provider.signAndSendTransaction(transaction);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return { signature, success: true };
    } catch (err) {
      console.error('Transaction error:', err);
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
