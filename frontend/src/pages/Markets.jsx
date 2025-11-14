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
      
      // ULTRA FAST: Load just 20 markets immediately
      const initialData = await marketService.getMarkets(20);
      setMarkets(initialData);
      setLoading(false);
      
      // Load more in waves
      setTimeout(async () => {
        const moreData = await marketService.getMarkets(80);
        setMarkets(moreData);
      }, 50);
      
      // Load all remaining in background
      setTimeout(async () => {
        try {
          const fullData = await marketService.getMarkets(150);
          setMarkets(fullData);
        } catch (error) {
          console.error('Error loading additional markets:', error);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error loading markets:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Compact Header with Search */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
                Discover Markets
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Live prediction markets • Updated real-time</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {filteredMarkets.length} Active
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search markets by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 shadow-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                  <div className="w-24 h-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No markets found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMarkets.map((market) => {
              // Get the top outcome for multi-outcome markets or use yesPrice
              const topPrice = market.is_multi_outcome 
                ? (market.outcomes && market.outcomes[0] ? market.outcomes[0].price : 0.5)
                : (market.yesPrice || 0.5);
              
              return (
                <div
                  key={market.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleMarketClick(market)}
                >
                  <div className="flex items-start gap-4">
                    {/* Market Image */}
                    {market.image && (
                      <div className="relative flex-shrink-0">
                        <img
                          src={market.image}
                          alt={market.title}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        {market.is_multi_outcome && (
                          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {market.outcomes?.length || 0}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Market Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                          {market.category}
                        </span>
                        {market.change24h !== 0 && (
                          <span className={`flex items-center gap-1 text-xs font-medium ${
                            market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {market.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Volume</span>
                          <div className="text-gray-900 font-semibold">${formatCurrency(market.volume)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Liquidity</span>
                          <div className="text-gray-900 font-semibold">${formatCurrency(market.liquidity)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Ends</span>
                          <div className="text-gray-900 font-semibold">
                            {new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price & Trade Button */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-0.5">Top outcome</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {(topPrice * 100).toFixed(0)}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarketClick(market);
                        }}
                      >
                        Trade <ArrowUpRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
