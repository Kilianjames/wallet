import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, TrendingUp, Wallet, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from '../contexts/WalletContext';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect, isReady } = useWallet();

  const navItems = [
    { path: '/trade', label: 'Trade', icon: TrendingUp },
    { path: '/markets', label: 'Markets', icon: LayoutGrid },
    { path: '/portfolio', label: 'Portfolio', icon: Wallet },
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
              src="https://customer-assets.emergentagent.com/job_d5c149cb-8bda-4095-b402-80a5f60716e4/artifacts/3mwtxpba_Untitled.jpeg"
              alt="Polyflux Logo"
              className="h-10 w-10 rounded-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              Polyflux
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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
            className="md:hidden text-[#7fffd4] hover:text-[#6eeec3] transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1a3a2e]">
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
                        ? 'bg-[#7fffd4] text-[#0a1f1a] font-semibold'
                        : 'text-gray-300 hover:bg-[#1a3a2e] hover:text-[#7fffd4]'
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
                className="bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-semibold mt-2 disabled:opacity-50"
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
