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

  const handleMarketClick = (market) => {
    // Navigate to trade page with market data in state
    navigate('/trade', { state: { selectedMarket: market } });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Markets</h1>
          <p className="text-gray-600">Explore and trade prediction markets</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="bg-gray-100">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Total Markets</div>
            <div className="text-3xl font-bold text-gray-900">{markets.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">24h Volume</div>
            <div className="text-3xl font-bold text-gray-900">
              ${(markets.reduce((sum, m) => sum + m.volume, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Total Liquidity</div>
            <div className="text-3xl font-bold text-gray-900">
              ${(markets.reduce((sum, m) => sum + m.liquidity, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Active Traders</div>
            <div className="text-3xl font-bold text-gray-900">12.4K</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        )}

        {/* Markets Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-600 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => handleMarketClick(market)}
              >
                {/* Market Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={market.image}
                    alt={market.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                      {market.category}
                    </span>
                  </div>
                  {market.change24h !== 0 && (
                    <div className="absolute top-4 right-4">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        market.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'
                      } text-white`}>
                        {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Market Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 line-clamp-2">
                    {market.title}
                  </h3>

                  {/* Show summary for multi-outcome, full prices for YES/NO */}
                  {market.is_multi_outcome ? (
                    /* Multi-outcome market - show top 3 outcomes as preview */
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-400 mb-3">
                        {market.outcomes.length} possible outcomes
                      </div>
                      {market.outcomes.slice(0, 3).map((outcome, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 truncate">{outcome.title}</span>
                          <span className="text-[#7fffd4] font-semibold ml-2">
                            ${(outcome.price * 100).toFixed(1)}¢
                          </span>
                        </div>
                      ))}
                      {market.outcomes.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-2">
                          +{market.outcomes.length - 3} more outcomes
                        </div>
                      )}
                    </div>
                  ) : (
                    /* YES/NO market */
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">YES Price</div>
                        <div className="text-2xl font-bold text-green-400">
                          ${(market.yesPrice * 100).toFixed(1)}¢
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs mb-1">NO Price</div>
                        <div className="text-2xl font-bold text-red-400">
                          ${(market.noPrice * 100).toFixed(1)}¢
                        </div>
                      </div>
                    </div>
                  )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarketClick(market);
                    }}
                    className="w-full bg-[#7fffd4] hover:bg-[#6eeec3] text-[#0a1f1a] font-semibold transition-all group"
                  >
                    Trade Now
                    <ArrowUpRight size={16} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredMarkets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No markets found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
