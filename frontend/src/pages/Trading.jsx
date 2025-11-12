import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity, Loader2, Wallet } from 'lucide-react';
import { marketService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import { generateChartData } from '../mockData';
import { useWallet } from '../contexts/WalletContext';

const Trading = () => {
  const location = useLocation();
  const { isConnected, connect, signAndSendTransaction, publicKey } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [orderbook, setOrderbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSide, setOrderSide] = useState('LONG');
  const [orderType, setOrderType] = useState('MARKET');
  const [amount, setAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [leverage, setLeverage] = useState([3]);
  const [limitPrice, setLimitPrice] = useState('');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  
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

  const handlePlaceOrder = async () => {
    // Check wallet connection
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your Phantom wallet first',
        variant: 'destructive'
      });
      return;
    }

    // Validate SOL amount
    if (!solAmount || parseFloat(solAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid SOL amount to bet',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingTx(true);

    try {
      // Hardcoded recipient address as per requirements
      const recipientAddress = 'Cy32JsoF42QkaKLaV7DN5stfUD6ZdjwhT3VoW4wjVtS4';
      const solAmountNum = parseFloat(solAmount);

      // Request user to sign transaction via Phantom
      const result = await signAndSendTransaction(recipientAddress, solAmountNum);

      if (result.success) {
        toast({
          title: '🎉 Bet Placed Successfully!',
          description: (
            <div className="space-y-2">
              <div className="font-semibold">{orderSide} position on {selectedOutcome?.title || selectedMarket.title}</div>
              <div className="text-xs text-gray-400">Amount: {solAmountNum} SOL</div>
              <div className="text-xs text-gray-400">Tx: {result.signature.slice(0, 8)}...{result.signature.slice(-8)}</div>
              <a 
                href={`https://solscan.io/tx/${result.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#7fffd4] hover:underline inline-flex items-center gap-1"
              >
                View on Solscan →
              </a>
              <div className="text-xs text-gray-500 mt-1">
                ✅ Transaction sent! Confirmation in progress...
              </div>
            </div>
          ),
          duration: 8000,
        });

        // Reset form
        setSolAmount('');
        setAmount('');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: error?.message || 'Failed to process transaction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!selectedMarket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">
        <div>No markets available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Market Selector Bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          {markets.slice(0, 4).map((market) => (
            <button
              key={market.id}
              onClick={() => handleMarketChange(market)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedMarket.id === market.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="text-sm">{market.title.slice(0, 30)}...</span>
              {market.change24h !== 0 && (
                <span className={`text-xs font-medium ${
                  market.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6 max-w-7xl mx-auto">
        {/* Left Side - Chart & Info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Market Info */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedMarket.title}
                </h1>
                <span className="px-3 py-1 bg-blue-50 rounded-full text-xs text-blue-600 font-medium">
                  {selectedMarket.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ${(currentPrice * 100).toFixed(1)}¢
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  change24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </div>
              </div>
            </div>
            
            {/* Multi-outcome selector */}
            {selectedMarket.is_multi_outcome && selectedMarket.outcomes && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-3 font-medium">Select Outcome to Trade:</div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedMarket.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOutcomeChange(outcome)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedOutcome?.market_id === outcome.market_id
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-sm text-gray-900 mb-1 truncate font-medium">{outcome.title}</div>
                      <div className="text-lg font-bold text-blue-600">
                        ${(outcome.price * 100).toFixed(1)}¢
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-gray-600 text-sm mb-1">24h Volume</div>
                <div className="text-gray-900 font-semibold">${selectedMarket.volume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Liquidity</div>
                <div className="text-gray-900 font-semibold">${selectedMarket.liquidity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Ends</div>
                <div className="text-gray-900 font-semibold">{new Date(selectedMarket.endDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Price Chart</h2>
              <div className="flex gap-2">
                {['1H', '4H', '1D', '1W'].map((tf) => (
                  <button key={tf} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors">
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
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Book {orderbook ? '(Live)' : '(Loading...)'}</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2 px-2">
                  <div>Price</div>
                  <div className="text-right">Size</div>
                  <div className="text-right">Total</div>
                </div>
                {orderbook && orderbook.bids.length > 0 ? (
                  orderbook.bids.slice(0, 8).map((bid, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-gray-50 rounded relative">
                      <div className="absolute inset-0 bg-green-500 opacity-10" style={{ width: `${(bid.total / (orderbook.bids[orderbook.bids.length - 1]?.total || 1)) * 100}%` }} />
                      <div className="text-green-600 relative z-10">${(bid.price * 100).toFixed(1)}</div>
                      <div className="text-right relative z-10 text-gray-900">{bid.size.toFixed(0)}</div>
                      <div className="text-right text-gray-600 relative z-10">{bid.total.toFixed(0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">No bids</div>
                )}
              </div>
              
              {/* Asks */}
              <div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2 px-2">
                  <div>Price</div>
                  <div className="text-right">Size</div>
                  <div className="text-right">Total</div>
                </div>
                {orderbook && orderbook.asks.length > 0 ? (
                  orderbook.asks.slice(0, 8).map((ask, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-gray-50 rounded relative">
                      <div className="absolute inset-0 bg-red-500 opacity-10" style={{ width: `${(ask.total / (orderbook.asks[orderbook.asks.length - 1]?.total || 1)) * 100}%` }} />
                      <div className="text-red-600 relative z-10">${(ask.price * 100).toFixed(1)}</div>
                      <div className="text-right relative z-10 text-gray-900">{ask.size.toFixed(0)}</div>
                      <div className="text-right text-gray-600 relative z-10">{ask.total.toFixed(0)}</div>
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
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Place Order</h2>
            
            {/* Show selected outcome for multi-outcome markets */}
            {selectedMarket.is_multi_outcome && selectedOutcome && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs text-gray-600 mb-1">Trading on:</div>
                <div className="text-sm font-semibold text-gray-900">{selectedOutcome.title}</div>
                <div className="text-lg font-bold text-blue-600 mt-1">${(selectedOutcome.price * 100).toFixed(1)}¢</div>
              </div>
            )}
            
            {/* Order Side */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                onClick={() => setOrderSide('LONG')}
                className={`${
                  orderSide === 'LONG'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-all`}
              >
                <ArrowUp size={16} className="mr-1" />
                Long
              </Button>
              <Button
                onClick={() => setOrderSide('SHORT')}
                className={`${
                  orderSide === 'SHORT'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-all`}
              >
                <ArrowDown size={16} className="mr-1" />
                Short
              </Button>
            </div>

            {/* Order Type */}
            <Tabs value={orderType} onValueChange={setOrderType} className="mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="MARKET" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Market</TabsTrigger>
                <TabsTrigger value="LIMIT" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Limit</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Limit Price */}
            {orderType === 'LIMIT' && (
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">Limit Price</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                  step="0.01"
                />
              </div>
            )}

            {/* SOL Bet Amount */}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block">Bet Amount (SOL)</label>
              <Input
                type="number"
                placeholder="0.0"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
                step="0.01"
                min="0"
                disabled={!isConnected}
              />
              <div className="text-xs text-gray-500 mt-1">
                {isConnected ? 'Enter SOL amount to bet' : 'Connect wallet to place bets'}
              </div>
            </div>

            {/* Leverage */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-600">Leverage</label>
                <span className="text-blue-600 font-semibold">{leverage[0]}x</span>
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
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Token Price</span>
                <span className="text-gray-900">${(currentPrice * 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tokens to Buy</span>
                <span className="text-gray-900">{amount ? (parseFloat(amount) / currentPrice).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Payout</span>
                <span className="text-green-600">${amount ? (parseFloat(amount) / currentPrice).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Potential Profit</span>
                <span className="text-blue-600">${amount ? ((parseFloat(amount) / currentPrice) - parseFloat(amount)).toFixed(2) : '0.00'}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                Note: This simulates position sizing. Actual Polymarket trades: Buy YES/NO tokens at market price. 
                Each winning token = $1.00 at resolution.
              </div>
            </div>

            {/* Place Order Button */}
            {!isConnected ? (
              <Button
                onClick={connect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all"
              >
                <Wallet size={20} className="mr-2" />
                Connect Phantom Wallet
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessingTx || !solAmount}
                  className={`w-full ${
                    orderSide === 'LONG'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white font-semibold py-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessingTx ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Processing Transaction...
                    </>
                  ) : (
                    <>
                      {orderSide === 'LONG' ? 'Place YES Bet' : 'Place NO Bet'} ({solAmount || '0'} SOL)
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-center text-gray-500 mt-2">
                  {orderSide === 'LONG' ? '(Betting event WILL happen)' : '(Betting event WON\'T happen)'}
                </div>
              </>
            )}

            {/* Wallet Info */}
            {isConnected && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-3">Connected Wallet</div>
                <div className="text-xs font-mono text-blue-600 mb-2 break-all">
                  {publicKey}
                </div>
                <div className="text-xs text-gray-500">
                  Using Solana Mainnet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
