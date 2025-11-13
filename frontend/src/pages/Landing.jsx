import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { marketService } from '../services/api';

const Landing = () => {
  const [stats, setStats] = useState({
    volume: '0M',
    markets: '0+',
    liquidity: '0M',
    traders: '12.4K'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const markets = await marketService.getMarkets(100);
      const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
      const totalLiquidity = markets.reduce((sum, m) => sum + m.liquidity, 0);
      
      setStats({
        volume: `$${(totalVolume / 1000000).toFixed(0)}M`,
        markets: `${markets.length}+`,
        liquidity: `$${(totalLiquidity / 1000000).toFixed(0)}M`,
        traders: '12.4K'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7fffd4] via-[#0a1f1a] to-[#0a1f1a] opacity-20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#7fffd4] rounded-full blur-3xl opacity-10 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#7fffd4] rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center">
              <img
                src="https://customer-assets.emergentagent.com/job_d5c149cb-8bda-4095-b402-80a5f60716e4/artifacts/3mwtxpba_Untitled.jpeg"
                alt="Polyflux Banner"
                className="h-24 rounded-lg shadow-lg"
              />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gray-900">
              Polyfluid
            </h1>
            <p className="text-xl text-gray-700 mb-4 max-w-2xl mx-auto">
              Trade perpetual positions on Polymarket prediction markets
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Leverage your predictions with up to 10x on real-world events
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/trade">
                <Button className="bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-bold text-lg px-8 py-6 transition-all transform hover:scale-105">
                  Start Trading
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link to="/markets">
                <Button variant="outline" className="border-2 border-[#7fffd4] text-[#7fffd4] hover:bg-[#7fffd4] hover:text-[#0a1f1a] font-bold text-lg px-8 py-6 transition-all">
                  Explore Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Volume', value: stats.volume },
            { label: 'Active Markets', value: stats.markets },
            { label: 'Total Liquidity', value: stats.liquidity },
            { label: 'Active Traders', value: stats.traders },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0d2520] rounded-xl p-8 border border-[#1a3a2e] hover:border-[#7fffd4] transition-all group">
              <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
              <div className="text-4xl font-bold text-[#7fffd4] group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#7fffd4] mb-4">Why Polyflux?</h2>
          <p className="text-xl text-gray-400">The most advanced perp DEX for prediction markets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Execute trades in milliseconds with our optimized trading engine',
            },
            {
              icon: Shield,
              title: 'Fully Secured',
              description: 'Non-custodial trading with smart contract security audits',
            },
            {
              icon: BarChart3,
              title: 'Deep Liquidity',
              description: 'Trade with confidence with $469M+ in available liquidity',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="bg-[#0d2520] rounded-xl p-8 border border-[#1a3a2e] hover:border-[#7fffd4] transition-all group"
              >
                <div className="w-16 h-16 bg-[#7fffd4] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={32} className="text-[#0a1f1a]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-[#0d2520] to-[#1a3a2e] rounded-3xl p-16 border border-[#7fffd4] relative overflow-hidden">
          <div className="absolute inset-0 bg-[#7fffd4] opacity-5" />
          <div className="relative text-center">
            <h2 className="text-5xl font-bold text-[#7fffd4] mb-6">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of traders leveraging prediction markets
            </p>
            <Link to="/trade">
              <Button className="bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-bold text-lg px-12 py-6 transition-all transform hover:scale-105">
                Launch App
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1a3a2e] mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://customer-assets.emergentagent.com/job_d5c149cb-8bda-4095-b402-80a5f60716e4/artifacts/3mwtxpba_Untitled.jpeg"
                alt="Polyflux Logo"
                className="h-8 w-8 rounded"
              />
              <span className="text-[#7fffd4] font-semibold">Polyflux</span>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Polyflux. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
