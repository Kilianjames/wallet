import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect, isReady } = useWallet();

  const navItems = [
    { path: '/markets', label: 'Markets' },
    { path: '/trade', label: 'Trade' },
    { path: '/portfolio', label: 'Portfolio' },
  ];

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top Banner with CA for Mobile */}
      <div className="lg:hidden bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-600">CA:</span>
            <code className="text-xs font-mono text-gray-700">CAurDj...HCpump</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText('CAurDj4T1jzsbPssynZKNYPYaB42m2wLxkjqjkHCpump');
              alert('Contract address copied!');
            }}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Copy
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & CA */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Polyfluid Logo"
                className="h-10 w-10 rounded-lg group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                Polyfluid
              </span>
            </Link>
            
            {/* Contract Address */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <span className="text-xs font-semibold text-purple-600">CA:</span>
              <code className="text-xs font-mono text-gray-700">CAurDj4T1jzsbPssynZKNYPYaB42m2wLxkjqjkHCpump</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('CAurDj4T1jzsbPssynZKNYPYaB42m2wLxkjqjkHCpump');
                  alert('Contract address copied!');
                }}
                className="text-purple-600 hover:text-purple-700 transition-colors"
                title="Copy CA"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Navigation - Clean & Modern */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-6 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Connect Wallet Button - Enhanced Design */}
          <div className="hidden md:block">
            <Button 
              onClick={handleWalletClick}
              disabled={!isReady}
              className={`font-semibold px-5 py-2 transition-all disabled:opacity-50 shadow-md ${
                isConnected 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {isConnected && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
              <Zap size={16} className="mr-2" />
              {!isReady ? 'Loading...' : isConnected ? formatAddress(address) : 'Connect Wallet'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              <Button 
                onClick={handleWalletClick}
                disabled={!isReady}
                className={`w-full font-semibold mt-4 shadow-md ${
                  isConnected 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {isConnected && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
                <Zap size={16} className="mr-2" />
                {!isReady ? 'Loading...' : isConnected ? formatAddress(address) : 'Connect Wallet'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
