import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Users, Clock } from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analytics?timeframe=${timeframe}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Market Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Real-time insights from Polymarket</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6">
          {['24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Volume */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
              <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalVolume ? formatCurrency(analytics.totalVolume) : '$0'}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {analytics?.volumeChange > 0 ? '+' : ''}{analytics?.volumeChange?.toFixed(1)}% vs previous
            </div>
          </div>

          {/* Total Markets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Markets</div>
              <Activity className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalMarkets || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics?.newMarkets || 0} new this period
            </div>
          </div>

          {/* Total Liquidity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Liquidity</div>
              <BarChart3 className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalLiquidity ? formatCurrency(analytics.totalLiquidity) : '$0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across all markets
            </div>
          </div>

          {/* Avg Participants */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Market Size</div>
              <Users className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.avgMarketSize ? formatCurrency(analytics.avgMarketSize) : '$0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Per market
            </div>
          </div>
        </div>

        {/* Top Markets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top by Volume */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              Top Markets by Volume
            </h2>
            <div className="space-y-3">
              {analytics?.topByVolume?.slice(0, 5).map((market, idx) => (
                <div key={market.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {market.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{market.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(market.volume)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top by Liquidity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
              Top Markets by Liquidity
            </h2>
            <div className="space-y-3">
              {analytics?.topByLiquidity?.slice(0, 5).map((market, idx) => (
                <div key={market.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {market.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{market.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(market.liquidity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="text-purple-600 dark:text-purple-400" size={24} />
            Markets by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics?.categoryBreakdown?.map((cat) => (
              <div key={cat.category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {cat.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{cat.category}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatCurrency(cat.totalVolume)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
