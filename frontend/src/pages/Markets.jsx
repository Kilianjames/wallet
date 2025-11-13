import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Loader2, Activity } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Compact Header with Search */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                Discover Markets
              </h1>
              <p className="text-sm text-gray-600">Live prediction markets • Updated real-time</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {filteredMarkets.length} Active
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search markets by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 bg-white border-gray-300 text-gray-900 rounded-xl shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        )}

        {/* Markets Grid - Creative Card Design */}
        {!loading && filteredMarkets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
                onClick={() => handleMarketClick(market)}
              >
                {/* Image with Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={market.image || `https://source.unsplash.com/600x400/?${encodeURIComponent(market.category)},prediction`}
                    alt={market.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Category & Status Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-gray-900 rounded-lg text-xs font-bold shadow-lg">
                      {market.category}
                    </span>
                    {market.is_multi_outcome && (
                      <span className="px-3 py-1.5 bg-purple-600/95 backdrop-blur-md text-white rounded-lg text-xs font-bold shadow-lg">
                        {market.outcomes?.length} Options
                      </span>
                    )}
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                      {market.title}
                    </h3>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4">
                  {/* Probability Display */}
                  {market.is_multi_outcome ? (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Top Outcomes:</div>
                      <div className="space-y-2">
                        {market.outcomes?.slice(0, 3).map((outcome, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 truncate flex-1">{outcome.title}</span>
                            <div className="flex items-center gap-2 ml-2">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: `${(outcome.price * 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-blue-600 min-w-[3rem] text-right">
                                {(outcome.price * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-stretch gap-2 h-20">
                        {/* YES Card */}
                        <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border-2 border-green-200">
                          <div className="text-xs text-green-700 font-semibold mb-1">YES</div>
                          <div className="text-2xl font-bold text-green-700 mb-1">
                            {((market.yesPrice || market.price) * 100).toFixed(0)}%
                          </div>
                          <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 rounded-full transition-all"
                              style={{ width: `${((market.yesPrice || market.price) * 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* NO Card */}
                        <div className="flex-1 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border-2 border-red-200">
                          <div className="text-xs text-red-700 font-semibold mb-1">NO</div>
                          <div className="text-2xl font-bold text-red-700 mb-1">
                            {((market.noPrice || (1 - market.price)) * 100).toFixed(0)}%
                          </div>
                          <div className="h-1.5 bg-red-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600 rounded-full transition-all"
                              style={{ width: `${((market.noPrice || (1 - market.price)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Stats & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Activity size={12} />
                        <span className="font-semibold text-gray-900">${(market.volume / 1000).toFixed(0)}K</span>
                      </div>
                      <div className={`flex items-center gap-1 font-bold ${
                        market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarketClick(market);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm hover:shadow-md"
                    >
                      Trade
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
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
