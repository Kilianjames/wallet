import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from '../contexts/WalletContext';

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
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <Button 
              onClick={handleWalletClick}
              disabled={!isReady}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 transition-all disabled:opacity-50 shadow-sm"
            >
              <Wallet size={18} className="mr-2" />
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
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <Button 
                onClick={handleWalletClick}
                disabled={!isReady}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2 disabled:opacity-50"
              >
                <Wallet size={18} className="mr-2" />
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
