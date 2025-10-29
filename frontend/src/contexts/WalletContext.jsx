import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { authenticated, ready, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [connectedWallet, setConnectedWallet] = useState(null);

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      setConnectedWallet(wallets[0]);
    } else {
      setConnectedWallet(null);
    }
  }, [authenticated, wallets]);

  const connect = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await logout();
      setConnectedWallet(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const value = {
    wallet: connectedWallet,
    address: connectedWallet?.address || null,
    isConnected: authenticated && !!connectedWallet,
    isReady: ready,
    connect,
    disconnect,
    user,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
