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

        {/* Markets Grid - Medium Cards with Images */}
        {!loading && filteredMarkets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => handleMarketClick(market)}
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
                  <img
                    src={market.image || `https://source.unsplash.com/400x300/?${encodeURIComponent(market.category)}`}
                    alt={market.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-md text-xs font-semibold">
                      {market.category}
                    </span>
                  </div>
                  
                  {/* Multi Badge */}
                  {market.is_multi_outcome && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-purple-600 text-white rounded-md text-xs font-semibold">
                        {market.outcomes?.length || 0} Options
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {market.title}
                  </h3>

                  {/* Probability Section */}
                  {market.is_multi_outcome ? (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2">Top Outcomes</div>
                      <div className="space-y-1">
                        {market.outcomes?.slice(0, 2).map((outcome, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate">{outcome.title}</span>
                            <span className="text-blue-600 font-semibold ml-2">{(outcome.price * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2">Probability</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-600 font-semibold">YES</span>
                            <span className="text-green-600 font-bold">{((market.yesPrice || market.price) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                              style={{ width: `${((market.yesPrice || market.price) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-gray-400">|</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-600 font-semibold">NO</span>
                            <span className="text-red-600 font-bold">{((market.noPrice || (1 - market.price)) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                              style={{ width: `${((market.noPrice || (1 - market.price)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>Vol</span>
                        <span className="font-medium text-gray-700">${(market.volume / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="w-px h-3 bg-gray-300" />
                      <div className="flex items-center gap-1">
                        <span>Liq</span>
                        <span className="font-medium text-gray-700">${(market.liquidity / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                      market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                    </div>
                  </div>

                  {/* Trade Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarketClick(market);
                    }}
                    className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Trade Now
                    <ArrowUpRight size={14} />
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
