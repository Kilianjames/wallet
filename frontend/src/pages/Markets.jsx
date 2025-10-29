import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from 'lucide-react';
import { marketService } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

const Markets = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['ALL', 'Crypto', 'Sports', 'Politics', 'Economics'];

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await marketService.getMarkets(50);
      setMarkets(data);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7fffd4] mb-2">Markets</h1>
          <p className="text-gray-400">Trade perpetuals on trending Polymarket events</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-[#0d2520] border-[#1a3a2e] text-white h-12"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-[#0d2520] border border-[#1a3a2e]">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Total Markets</div>
            <div className="text-3xl font-bold text-[#7fffd4]">{trendingMarkets.length}</div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">24h Volume</div>
            <div className="text-3xl font-bold text-[#7fffd4]">
              ${(trendingMarkets.reduce((sum, m) => sum + m.volume, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Total Liquidity</div>
            <div className="text-3xl font-bold text-[#7fffd4]">
              ${(trendingMarkets.reduce((sum, m) => sum + m.liquidity, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Active Traders</div>
            <div className="text-3xl font-bold text-[#7fffd4]">12.4K</div>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <div
              key={market.id}
              className="bg-[#0d2520] rounded-xl border border-[#1a3a2e] overflow-hidden hover:border-[#7fffd4] transition-all group cursor-pointer"
              onClick={() => navigate('/trade')}
            >
              {/* Market Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={market.image}
                  alt={market.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d2520] to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#7fffd4] text-[#0a1f1a] rounded-full text-xs font-semibold">
                    {market.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    market.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}>
                    {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Market Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 line-clamp-2">
                  {market.title}
                </h3>

                {/* Price Display */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">YES Price</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${(market.yesPrice * 100).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs mb-1">NO Price</div>
                    <div className="text-2xl font-bold text-red-400">
                      ${(market.noPrice * 100).toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#1a3a2e]">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Volume</div>
                    <div className="text-white font-semibold text-sm">
                      ${(market.volume / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Liquidity</div>
                    <div className="text-white font-semibold text-sm">
                      ${(market.liquidity / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  onClick={() => navigate('/trade')}
                  className="w-full bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-semibold transition-all group"
                >
                  Trade Now
                  <ArrowUpRight size={16} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredMarkets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No markets found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
