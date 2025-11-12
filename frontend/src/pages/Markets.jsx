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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        )}

        {/* Markets List - Compact Design */}
        {!loading && filteredMarkets.length > 0 && (
          <div className="space-y-3">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleMarketClick(market)}
              >
                <div className="flex items-start gap-4">
                  {/* Left: Market Info */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Category */}
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                        {market.title}
                      </h3>
                      <div className="flex gap-1 shrink-0">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                          {market.category}
                        </span>
                        {market.is_multi_outcome && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                            Multi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Vol:</span>
                        <span>${(market.volume / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Liq:</span>
                        <span>${(market.liquidity / 1000).toFixed(0)}K</span>
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${
                        market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {market.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Right: Price Display */}
                  <div className="shrink-0">
                    {market.is_multi_outcome ? (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">{market.outcomes?.length || 0} outcomes</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${(market.price * 100).toFixed(1)}¢
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">YES</div>
                          <div className="text-xl font-bold text-green-600">
                            ${((market.yesPrice || market.price) * 100).toFixed(1)}¢
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">NO</div>
                          <div className="text-xl font-bold text-red-600">
                            ${((market.noPrice || (1 - market.price)) * 100).toFixed(1)}¢
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarketClick(market);
                    }}
                    className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    Trade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredMarkets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No markets found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
