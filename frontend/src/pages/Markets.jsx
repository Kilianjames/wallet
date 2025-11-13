import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Loader2, Activity } from 'lucide-react';
import { marketService } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { formatCurrency } from '../utils/formatters';

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

        {/* Markets List - Horizontal Rectangle Cards */}
        {!loading && filteredMarkets.length > 0 && (
          <div className="space-y-3">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-500"
                onClick={() => handleMarketClick(market)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left: Small Thumbnail */}
                  <div className="relative w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden">
                    <img
                      src={market.image || `https://source.unsplash.com/300x300/?${encodeURIComponent(market.category)},prediction`}
                      alt={market.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {market.is_multi_outcome && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">
                          {market.outcomes?.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    {/* Top: Title and Category */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                            {market.category}
                          </span>
                          <div className={`flex items-center gap-1 text-xs font-semibold ${
                            market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {market.title}
                        </h3>
                      </div>

                      {/* Probability Display - Right Side */}
                      {market.is_multi_outcome ? (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Top outcome</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {market.outcomes?.[0] ? (market.outcomes[0].price * 100).toFixed(0) : '0'}%
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">YES</div>
                            <div className="text-xl font-bold text-green-600">
                              {((market.yesPrice || market.price) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="w-px bg-gray-200" />
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">NO</div>
                            <div className="text-xl font-bold text-red-600">
                              {((market.noPrice || (1 - market.price)) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Stats Columns */}
                    <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
                      <div className="flex items-center gap-6 text-xs">
                        <div>
                          <div className="text-gray-500 mb-0.5">Volume</div>
                          <div className="font-bold text-gray-900">{formatCurrency(market.volume)}</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div>
                          <div className="text-gray-500 mb-0.5">Liquidity</div>
                          <div className="font-bold text-gray-900">{formatCurrency(market.liquidity)}</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div>
                          <div className="text-gray-500 mb-0.5">Ends</div>
                          <div className="font-bold text-gray-900">
                            {new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarketClick(market);
                        }}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        Trade
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
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
