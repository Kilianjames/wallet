import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, TrendingUp, Wallet, Menu, X } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/trade', label: 'Trade', icon: TrendingUp },
    { path: '/markets', label: 'Markets', icon: LayoutGrid },
    { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  ];

  const handleWalletClick = () => {
    alert('To enable wallet connection:\n\n1. Get FREE Privy App ID from https://dashboard.privy.io\n2. Update /app/frontend/.env with your App ID\n3. Restart frontend\n\nSee /app/PRIVY_SETUP.md for details!');
  };

  return (
    <nav className="bg-[#0d2520] border-b border-[#1a3a2e] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="https://customer-assets.emergentagent.com/job_e3912c72-e03b-483a-9a13-e7cb5f99c7ec/artifacts/tpoy6ypf_ZMgOwNQU_400x400.jpg"
              alt="Polynator Logo"
              className="h-12 w-12 rounded-lg group-hover:scale-110 transition-transform"
            />
            <span className="text-2xl font-bold text-[#7fffd4] group-hover:text-[#6eeec3] transition-colors">
              Polynator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
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
          </div>

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <Button 
              onClick={handleWalletClick}
              className="bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-semibold px-6 transition-all"
            >
              <Wallet size={18} className="mr-2" />
              Connect Wallet
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
