import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { marketService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import { generateChartData } from '../mockData';

const Trading = () => {
  const location = useLocation();
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [orderbook, setOrderbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSide, setOrderSide] = useState('LONG');
  const [orderType, setOrderType] = useState('MARKET');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState([3]);
  const [limitPrice, setLimitPrice] = useState('');
  
  const chartData = useMemo(() => generateChartData(), [selectedMarket?.id]);

  useEffect(() => {
    loadMarkets();
  }, []);

  // Check if market was passed from Markets page
  useEffect(() => {
    if (location.state?.selectedMarket && markets.length > 0) {
      const passedMarket = location.state.selectedMarket;
      // Find the market in our loaded markets list
      const foundMarket = markets.find(m => m.id === passedMarket.id) || passedMarket;
      setSelectedMarket(foundMarket);
      if (foundMarket.is_multi_outcome && foundMarket.outcomes?.length > 0) {
        setSelectedOutcome(foundMarket.outcomes[0]);
      }
    }
  }, [location.state, markets]);

  useEffect(() => {
    if (selectedMarket) {
      // If multi-outcome and no outcome selected, select first one
      if (selectedMarket.is_multi_outcome && !selectedOutcome && selectedMarket.outcomes?.length > 0) {
        setSelectedOutcome(selectedMarket.outcomes[0]);
      }
      // Load orderbook based on selected outcome or market token
      const tokenId = selectedOutcome?.token_id || selectedMarket.token_id;
      if (tokenId) {
        loadOrderbook(tokenId);
      }
    }
  }, [selectedMarket?.id, selectedOutcome?.market_id]);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await marketService.getMarkets(10);
      setMarkets(data);
      if (data.length > 0) {
        setSelectedMarket(data[0]);
        if (data[0].is_multi_outcome && data[0].outcomes?.length > 0) {
          setSelectedOutcome(data[0].outcomes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading markets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load markets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrderbook = async (tokenId) => {
    try {
      const data = await marketService.getOrderbook(tokenId);
      setOrderbook(data);
    } catch (error) {
      console.error('Error loading orderbook:', error);
      // Use fallback empty orderbook
      setOrderbook({ bids: [], asks: [] });
    }
  };

  const handleMarketChange = (market) => {
    setSelectedMarket(market);
    setSelectedOutcome(null);
    if (market.is_multi_outcome && market.outcomes?.length > 0) {
      setSelectedOutcome(market.outcomes[0]);
    }
  };

  const handleOutcomeChange = (outcome) => {
    setSelectedOutcome(outcome);
  };

  const currentPrice = selectedOutcome?.price || selectedMarket?.yesPrice || 0.5;
  const change24h = selectedMarket?.change24h || 0;

  const handlePlaceOrder = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Order Placed Successfully',
      description: `${orderSide} ${amount} USDC at ${leverage[0]}x leverage`,
    });
    
    setAmount('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7fffd4]" size={48} />
      </div>
    );
  }

  if (!selectedMarket) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center text-white">
        <div>No markets available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Market Selector Bar */}
      <div className="border-b border-[#1a3a2e] bg-[#0d2520] px-6 py-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          {markets.slice(0, 4).map((market) => (
            <button
              key={market.id}
              onClick={() => handleMarketChange(market)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedMarket.id === market.id
                  ? 'bg-[#7fffd4] text-[#0a1f1a] font-semibold'
                  : 'bg-[#1a3a2e] hover:bg-[#254538] text-gray-300'
              }`}
            >
              <span className="text-sm">{market.title.slice(0, 30)}...</span>
              {market.change24h !== 0 && (
                <span className={`text-xs ${
                  market.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6">
        {/* Left Side - Chart & Info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Market Info */}
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#7fffd4] mb-2">
                  {selectedMarket.title}
                </h1>
                <span className="px-3 py-1 bg-[#1a3a2e] rounded-full text-xs text-[#7fffd4]">
                  {selectedMarket.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  ${(currentPrice * 100).toFixed(1)}¢
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </div>
              </div>
            </div>
            
            {/* Multi-outcome selector */}
            {selectedMarket.is_multi_outcome && selectedMarket.outcomes && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-3">Select Outcome to Trade:</div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedMarket.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOutcomeChange(outcome)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedOutcome?.market_id === outcome.market_id
                          ? 'border-[#7fffd4] bg-[#1a3a2e]'
                          : 'border-[#1a3a2e] hover:border-[#254538]'
                      }`}
                    >
                      <div className="text-sm text-white mb-1 truncate">{outcome.title}</div>
                      <div className="text-lg font-bold text-[#7fffd4]">
                        ${(outcome.price * 100).toFixed(1)}¢
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">24h Volume</div>
                <div className="text-white font-semibold">${selectedMarket.volume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Liquidity</div>
                <div className="text-white font-semibold">${selectedMarket.liquidity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Ends</div>
                <div className="text-white font-semibold">{new Date(selectedMarket.endDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#7fffd4]">Price Chart</h2>
              <div className="flex gap-2">
                {['1H', '4H', '1D', '1W'].map((tf) => (
                  <button key={tf} className="px-3 py-1 bg-[#1a3a2e] hover:bg-[#254538] rounded text-xs transition-colors">
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[400px] relative">
              <svg width="100%" height="100%" className="overflow-visible">
                {chartData.map((point, i) => {
                  if (i === 0) return null;
                  const prevPoint = chartData[i - 1];
                  const x1 = (i - 1) * (100 / chartData.length);
                  const x2 = i * (100 / chartData.length);
                  const y1 = (1 - prevPoint.price) * 100;
                  const y2 = (1 - point.price) * 100;
                  
                  return (
                    <line
                      key={i}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#7fffd4"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-[#7fffd4] to-transparent opacity-10" />
            </div>
          </div>

          {/* Orderbook */}
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <h2 className="text-lg font-semibold text-[#7fffd4] mb-4">Order Book {orderbook ? '(Live)' : '(Loading...)'}</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2 px-2">
                  <div>Price</div>
                  <div className="text-right">Size</div>
                  <div className="text-right">Total</div>
                </div>
                {orderbook && orderbook.bids.length > 0 ? (
                  orderbook.bids.slice(0, 8).map((bid, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-[#1a3a2e] rounded relative">
                      <div className="absolute inset-0 bg-green-500 opacity-10" style={{ width: `${(bid.total / (orderbook.bids[orderbook.bids.length - 1]?.total || 1)) * 100}%` }} />
                      <div className="text-green-400 relative z-10">${(bid.price * 100).toFixed(1)}</div>
                      <div className="text-right relative z-10">{bid.size.toFixed(0)}</div>
                      <div className="text-right text-gray-400 relative z-10">{bid.total.toFixed(0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">No bids</div>
                )}
              </div>
              
              {/* Asks */}
              <div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2 px-2">
                  <div>Price</div>
                  <div className="text-right">Size</div>
                  <div className="text-right">Total</div>
                </div>
                {orderbook && orderbook.asks.length > 0 ? (
                  orderbook.asks.slice(0, 8).map((ask, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-[#1a3a2e] rounded relative">
                      <div className="absolute inset-0 bg-red-500 opacity-10" style={{ width: `${(ask.total / (orderbook.asks[orderbook.asks.length - 1]?.total || 1)) * 100}%` }} />
                      <div className="text-red-400 relative z-10">${(ask.price * 100).toFixed(1)}</div>
                      <div className="text-right relative z-10">{ask.size.toFixed(0)}</div>
                      <div className="text-right text-gray-400 relative z-10">{ask.total.toFixed(0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">No asks</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Order Entry */}
        <div className="space-y-4">
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e] sticky top-6">
            <h2 className="text-lg font-semibold text-[#7fffd4] mb-4">Place Order</h2>
            
            {/* Show selected outcome for multi-outcome markets */}
            {selectedMarket.is_multi_outcome && selectedOutcome && (
              <div className="mb-4 p-3 bg-[#1a3a2e] rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Trading on:</div>
                <div className="text-sm font-semibold text-[#7fffd4]">{selectedOutcome.title}</div>
                <div className="text-lg font-bold text-white mt-1">${(selectedOutcome.price * 100).toFixed(1)}¢</div>
              </div>
            )}
            
            {/* Order Side */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                onClick={() => setOrderSide('LONG')}
                className={`${
                  orderSide === 'LONG'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-[#1a3a2e] hover:bg-[#254538] text-gray-300'
                } transition-all`}
              >
                <ArrowUp size={16} className="mr-1" />
                Long
              </Button>
              <Button
                onClick={() => setOrderSide('SHORT')}
                className={`${
                  orderSide === 'SHORT'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[#1a3a2e] hover:bg-[#254538] text-gray-300'
                } transition-all`}
              >
                <ArrowDown size={16} className="mr-1" />
                Short
              </Button>
            </div>

            {/* Order Type */}
            <Tabs value={orderType} onValueChange={setOrderType} className="mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-[#1a3a2e]">
                <TabsTrigger value="MARKET" className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]">Market</TabsTrigger>
                <TabsTrigger value="LIMIT" className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]">Limit</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Limit Price */}
            {orderType === 'LIMIT' && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Limit Price</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-[#1a3a2e] border-[#254538] text-white"
                  step="0.01"
                />
              </div>
            )}

            {/* Amount */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Amount (USDC)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#1a3a2e] border-[#254538] text-white"
              />
            </div>

            {/* Leverage */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">Leverage</label>
                <span className="text-[#7fffd4] font-semibold">{leverage[0]}x</span>
              </div>
              <Slider
                value={leverage}
                onValueChange={setLeverage}
                min={1}
                max={10}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1x</span>
                <span>10x</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-[#1a3a2e] rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Token Price</span>
                <span className="text-white">${(currentPrice * 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tokens to Buy</span>
                <span className="text-white">{amount ? (parseFloat(amount) / currentPrice).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Payout</span>
                <span className="text-green-400">${amount ? (parseFloat(amount) / currentPrice).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Potential Profit</span>
                <span className="text-[#7fffd4]">${amount ? ((parseFloat(amount) / currentPrice) - parseFloat(amount)).toFixed(2) : '0.00'}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-[#254538]">
                Note: This simulates position sizing. Actual Polymarket trades: Buy YES/NO tokens at market price. 
                Each winning token = $1.00 at resolution.
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              className={`w-full ${
                orderSide === 'LONG'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-semibold py-6 transition-all`}
            >
              {orderSide === 'LONG' ? 'Buy YES Tokens' : 'Buy NO Tokens'}
            </Button>
            
            <div className="text-xs text-center text-gray-500 mt-2">
              {orderSide === 'LONG' ? '(Betting event WILL happen)' : '(Betting event WON\'T happen)'}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-[#1a3a2e]">
              <div className="text-xs text-gray-400 mb-3">Account Balance</div>
              <div className="text-2xl font-bold text-[#7fffd4] mb-4">$10,000.00</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">Available</div>
                  <div className="text-white font-semibold">$8,500.00</div>
                </div>
                <div>
                  <div className="text-gray-400">In Orders</div>
                  <div className="text-white font-semibold">$1,500.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
