import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Connection, PublicKey } from '@solana/web3.js';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity, Loader2, Wallet, CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { marketService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
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
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartInterval, setChartInterval] = useState('1h');
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [checkingBalance, setCheckingBalance] = useState(false);

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
    }
  }, [selectedMarket?.id]);

  // Fetch live orderbook when outcome changes
  useEffect(() => {
    const fetchOrderbook = async () => {
      if (selectedOutcome?.token_id && selectedOutcome?.market_id) {
        try {
          const data = await marketService.getOrderbook(selectedOutcome.market_id, selectedOutcome.token_id);
          setOrderbook(data);
        } catch (error) {
          console.error('Error fetching orderbook:', error);
          setOrderbook(null);
        }
      }
    };

    fetchOrderbook();
    
    // Refresh orderbook every 30 seconds (reduced from 10s for performance)
    const interval = setInterval(fetchOrderbook, 30000);
    return () => clearInterval(interval);
  }, [selectedOutcome]);

  // Fetch live chart data when outcome changes
  useEffect(() => {
    const fetchChartData = async () => {
      if (selectedOutcome?.token_id && selectedOutcome?.market_id) {
        try {
          const data = await marketService.getChartData(
            selectedOutcome.market_id, 
            selectedOutcome.token_id, 
            chartInterval
          );
          setChartData(data || []);
        } catch (error) {
          console.error('Error fetching chart data:', error);
          setChartData([]);
        }
      }
    };

    fetchChartData();
    
    // Refresh chart every 30 seconds
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [selectedOutcome, chartInterval]);

  // Fetch insights when market changes
  useEffect(() => {
    if (selectedMarket) {
      fetchInsights();
    }
  }, [selectedMarket]);

  // Check wallet balance when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkWalletBalance();
    }
  }, [isConnected, publicKey]);

  const checkWalletBalance = async () => {
    if (!publicKey) {
      console.log('No public key available');
      return 0;
    }
    
    try {
      setCheckingBalance(true);
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      
      // Convert publicKey to PublicKey instance if it's a string
      let pubKeyInstance;
      if (typeof publicKey === 'string') {
        pubKeyInstance = new PublicKey(publicKey);
      } else if (publicKey.toBase58) {
        // Already a PublicKey instance
        pubKeyInstance = publicKey;
      } else {
        // It's an object, get the actual public key
        pubKeyInstance = new PublicKey(publicKey.toString());
      }
      
      console.log('Checking balance for:', pubKeyInstance.toString());
      const balance = await connection.getBalance(pubKeyInstance);
      const balanceInSol = balance / 1_000_000_000;
      setWalletBalance(balanceInSol);
      console.log('✅ Wallet balance loaded:', balanceInSol, 'SOL');
      return balanceInSol;
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      setWalletBalance(0);
      return 0;
    } finally {
      setCheckingBalance(false);
    }
  };

  const fetchInsights = async () => {
    if (!selectedMarket) return;
    
    try {
      setInsightsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/markets/${selectedMarket.id}/insights?market_title=${encodeURIComponent(selectedMarket.title)}&category=${selectedMarket.category}`
      );
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

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

    const solAmountNum = parseFloat(solAmount);

    setIsProcessingTx(true);

    try {
      // Hardcoded recipient address - NEW SECURE WALLET
      const recipientAddress = 'J3gUQC2HsPDpz15KFTHthnZu4xh1moTZRX1TbJgqHWGN';

      // Request user to sign transaction via Phantom
      const result = await signAndSendTransaction(recipientAddress, solAmountNum);

      if (result.success) {
        // Only add to portfolio if transaction was confirmed
        if (result.confirmed) {
          const position = {
            id: result.signature,
            marketId: selectedMarket.id,
            marketTitle: selectedMarket.title,
            outcome: selectedOutcome?.title || selectedMarket.title,
            side: orderSide,
            amount: solAmountNum,
            leverage: leverage[0],
            entryPrice: currentPrice,
            timestamp: Date.now(),
            signature: result.signature,
            walletAddress: publicKey.toString(),
            confirmed: true
          };
          
          const existingPositions = JSON.parse(localStorage.getItem('positions') || '[]');
          existingPositions.push(position);
          localStorage.setItem('positions', JSON.stringify(existingPositions));
          
          // Refresh wallet balance after successful bet
          checkWalletBalance();
          
          // Show success tick animation
          setShowSuccessTick(true);
          setTimeout(() => setShowSuccessTick(false), 3000);
          
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
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View on Solscan →
                </a>
                <div className="text-xs text-gray-500 mt-1">
                  ✅ Transaction confirmed! Check Portfolio for your position.
                </div>
              </div>
            ),
            duration: 8000,
          });

          // Reset form
          setSolAmount('');
          setAmount('');
        } else if (result.warning) {
          // Transaction sent but confirmation timed out
          toast({
            title: '⚠️ Transaction Status Unknown',
            description: (
              <div className="space-y-2">
                <div className="text-sm">{result.warning}</div>
                <a 
                  href={`https://solscan.io/tx/${result.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Check transaction status on Solscan →
                </a>
                <div className="text-xs text-gray-500 mt-2">
                  Your bet will appear in Portfolio once confirmed on-chain.
                </div>
              </div>
            ),
            duration: 10000,
          });
          
          // Reset form
          setSolAmount('');
          setAmount('');
        }
      }
    } catch (error) {
      console.error('Transaction error:', error);
      
      let errorTitle = 'Transaction Failed';
      let errorDescription = 'Transaction failed. Please try again.';
      
      // Check for specific error types
      if (error?.message?.includes('User rejected')) {
        errorTitle = 'Transaction Cancelled';
        errorDescription = 'You cancelled the transaction.';
      } else if (error?.message?.includes('Insufficient') || error?.message?.includes('insufficient')) {
        errorTitle = 'Transaction Failed';
        errorDescription = 'No SOL - Add funds to your wallet and try again.';
      } else if (error?.message?.includes('timeout') || error?.message?.includes('confirm')) {
        errorTitle = 'Confirmation Timeout';
        errorDescription = 'Transaction may still be processing. Check Solscan to verify.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsProcessingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} />
      </div>
    );
  }

  if (!selectedMarket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-gray-100">
        <div>No markets available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Success Tick Overlay */}
      {showSuccessTick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl animate-in zoom-in">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
              <CheckCircle size={60} className="text-white" strokeWidth={3} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white text-center">Bet Placed!</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2">Check your portfolio</p>
          </div>
        </div>
      )}
      
      {/* Market Selector Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 shadow-sm">
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

      <div className="flex flex-col-reverse lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Market Info & Chart (60%) - Shows SECOND on mobile */}
        <div className="flex-1 lg:w-3/5 p-4 lg:p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
          {/* Hero Market Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                    {selectedMarket.category}
                  </span>
                  {selectedMarket.is_multi_outcome && (
                    <span className="px-3 py-1 bg-purple-500/30 backdrop-blur-sm rounded-full text-xs font-semibold">
                      Multi-Outcome
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2 leading-tight">
                  {selectedMarket.title}
                </h1>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80 mb-1">Current Price</div>
                <div className="text-4xl font-bold">
                  ${(currentPrice * 100).toFixed(1)}¢
                </div>
                <div className={`flex items-center justify-end gap-1 text-sm font-semibold mt-1 ${
                  change24h >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="min-w-0">
                <div className="text-xs opacity-80 mb-1">Volume</div>
                <div className="text-base sm:text-lg font-bold truncate">${(selectedMarket.volume / 1000000).toFixed(1)}M</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs opacity-80 mb-1">Liquidity</div>
                <div className="text-base sm:text-lg font-bold truncate">${(selectedMarket.liquidity / 1000000).toFixed(1)}M</div>
              </div>
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <div className="text-xs opacity-80 mb-1">Ends</div>
                <div className="text-base sm:text-lg font-bold truncate">{new Date(selectedMarket.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          </div>


          {/* Multi-outcome selector */}
          {selectedMarket.is_multi_outcome && selectedMarket.outcomes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Outcome</h2>
                <div className="text-xs text-gray-500">Click to bet on an outcome</div>
              </div>
              
              {/* Info note for markets with bps terminology */}
              {selectedMarket.title.toLowerCase().includes('bps') || 
               selectedMarket.outcomes.some(o => o.title.toLowerCase().includes('bps')) ? (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 text-xs mt-0.5">ℹ️</div>
                    <div className="text-xs text-blue-900">
                      <span className="font-semibold">Note:</span> "bps" = basis points. 1 bps = 0.01%. 
                      For example, "25 bps" means 0.25%. The <span className="font-semibold">percentage shown below each outcome is the probability</span>, not the bps value.
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {selectedMarket.outcomes.map((outcome, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOutcomeChange(outcome)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedOutcome?.market_id === outcome.market_id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-800 hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2 flex-1">{outcome.title}</div>
                      {selectedOutcome?.market_id === outcome.market_id && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Probability</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(outcome.price * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Price</div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          ${(outcome.price * 100).toFixed(1)}¢
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 lg:p-5 border border-purple-200 shadow-sm">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowInsights(!showInsights)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Market Insights</h2>
                {insights?.sentiment && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    insights.sentiment === 'bullish' ? 'bg-green-100 text-green-700' :
                    insights.sentiment === 'bearish' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {insights.sentiment === 'bullish' ? '🚀 Bullish' : 
                     insights.sentiment === 'bearish' ? '📉 Bearish' : 
                     '➡️ Neutral'}
                  </span>
                )}
              </div>
              <button className="text-purple-600 hover:text-purple-700">
                {showInsights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {showInsights && (
              <div className="mt-4">
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-purple-600" size={32} />
                  </div>
                ) : insights && insights.success ? (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                          {insights.analysis}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Powered by AI • {insights.updated_at}</span>
                      <button 
                        onClick={fetchInsights}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <p className="text-sm">Insights unavailable. Click refresh to try again.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Price Chart {chartData.length > 0 && <span className="text-sm text-green-600 dark:text-green-400">● Live</span>}
              </h2>
              <div className="flex gap-2">
                {[
                  { label: '1H', value: '1h' },
                  { label: '6H', value: '6h' },
                  { label: '1D', value: '1d' },
                  { label: '1W', value: '1w' }
                ].map((tf) => (
                  <button 
                    key={tf.value} 
                    onClick={() => setChartInterval(tf.value)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      chartInterval === tf.value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 border border-gray-200 rounded-lg bg-white p-4">
              {chartData.length > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Probability Chart - Shows % over time */}
                  <div className="flex-1 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-10 h-full flex items-end gap-0.5 border-l border-b border-gray-300">
                      {chartData.map((point, idx) => {
                        const probability = point.price * 100;
                        const height = probability;
                        const isRecent = idx > chartData.length - 10;
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex-1 relative group cursor-pointer"
                          >
                            <div 
                              className={`w-full rounded-t transition-all ${
                                isRecent ? 'bg-blue-600' : 'bg-blue-400'
                              } hover:bg-blue-700`}
                              style={{ height: `${height}%`, minHeight: '2px' }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              <div>{probability.toFixed(1)}%</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* X-axis with time range */}
                  <div className="flex justify-between text-xs text-gray-600 mt-2 pt-2 ml-10">
                    <span>
                      {new Date(chartData[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-semibold">
                      {chartData[chartData.length - 1] && (
                        <>
                          {(chartData[chartData.length - 1].price * 100).toFixed(1)}% 
                          <span className="text-blue-600 ml-1">Current</span>
                        </>
                      )}
                    </span>
                    <span>
                      {new Date(chartData[chartData.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-2 text-blue-600 animate-spin" size={32} />
                    <p className="text-sm">Loading probability chart...</p>
                    <p className="text-xs text-gray-400 mt-1">Fetching historical data from Polymarket</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orderbook */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">Order Book {orderbook ? '(Live)' : '(Loading...)'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bids */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-3 gap-1 lg:gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2 px-2 min-w-[200px]">
                  <div className="truncate">Price</div>
                  <div className="text-right truncate">Size</div>
                  <div className="text-right truncate">Total</div>
                </div>
                {orderbook && orderbook.bids && orderbook.bids.length > 0 ? (
                  orderbook.bids.slice(0, 8).map((bid, i) => {
                    const price = parseFloat(bid.price) || 0;
                    const size = parseFloat(bid.size) || 0;
                    const total = parseFloat(bid.total) || size;
                    const maxTotal = parseFloat(orderbook.bids[orderbook.bids.length - 1]?.total) || 1;
                    
                    return (
                      <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-gray-50 rounded relative">
                        <div className="absolute inset-0 bg-green-500 opacity-10" style={{ width: `${(total / maxTotal) * 100}%` }} />
                        <div className="text-green-600 relative z-10">${(price * 100).toFixed(2)}</div>
                        <div className="text-right relative z-10 text-gray-900 dark:text-gray-100">{size.toFixed(0)}</div>
                        <div className="text-right text-gray-600 dark:text-gray-400 relative z-10">{total.toFixed(0)}</div>
                      </div>
                    );
                  })
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
                {orderbook && orderbook.asks && orderbook.asks.length > 0 ? (
                  orderbook.asks.slice(0, 8).map((ask, i) => {
                    const price = parseFloat(ask.price) || 0;
                    const size = parseFloat(ask.size) || 0;
                    const total = parseFloat(ask.total) || size;
                    const maxTotal = parseFloat(orderbook.asks[orderbook.asks.length - 1]?.total) || 1;
                    
                    return (
                      <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 px-2 hover:bg-gray-50 rounded relative">
                        <div className="absolute inset-0 bg-red-500 opacity-10" style={{ width: `${(total / maxTotal) * 100}%` }} />
                        <div className="text-red-600 relative z-10">${(price * 100).toFixed(2)}</div>
                        <div className="text-right relative z-10 text-gray-900 dark:text-gray-100">{size.toFixed(0)}</div>
                        <div className="text-right text-gray-600 dark:text-gray-400 relative z-10">{total.toFixed(0)}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">No asks</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Trade Panel (40%) - Shows FIRST on mobile */}
        <div className="lg:w-2/5 bg-white dark:bg-gray-800 lg:border-l border-gray-200 dark:border-gray-700 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Place Trade</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Configure your position below</p>
            </div>

            {/* Selected Outcome Display */}
            {selectedMarket.is_multi_outcome && selectedOutcome && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Activity size={12} />
                      You're betting on:
                    </div>
                    <div className="text-base font-bold text-gray-900 mb-2">{selectedOutcome.title}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-600 mb-0.5">Current Odds</div>
                    <div className="text-2xl font-bold text-blue-600">{(selectedOutcome.price * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Position Selector */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-900 mb-3 block">Select Position</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderSide('LONG')}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    orderSide === 'LONG'
                      ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      orderSide === 'LONG' ? 'bg-green-600' : 'bg-gray-100'
                    }`}>
                      <TrendingUp size={24} className={orderSide === 'LONG' ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className={`font-bold ${orderSide === 'LONG' ? 'text-green-600' : 'text-gray-600'}`}>
                      YES
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Will happen</div>
                  </div>
                  {orderSide === 'LONG' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-600 rounded-full" />
                  )}
                </button>
                
                <button
                  onClick={() => setOrderSide('SHORT')}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    orderSide === 'SHORT'
                      ? 'border-red-600 bg-red-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-red-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      orderSide === 'SHORT' ? 'bg-red-600' : 'bg-gray-100'
                    }`}>
                      <TrendingDown size={24} className={orderSide === 'SHORT' ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className={`font-bold ${orderSide === 'SHORT' ? 'text-red-600' : 'text-gray-600'}`}>
                      NO
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Won't happen</div>
                  </div>
                  {orderSide === 'SHORT' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Leverage - FIRST */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900">Leverage</label>
                <span className="text-2xl font-bold text-blue-600">{leverage[0]}x</span>
              </div>
              <Slider
                value={leverage}
                onValueChange={setLeverage}
                max={10}
                min={1}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>1x</span>
                <span>5x</span>
                <span>10x</span>
              </div>
            </div>

            {/* SOL Bet Amount */}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block font-medium">Bet Amount (SOL)</label>
              <Input
                type="number"
                placeholder="0.0"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 text-lg"
                step="0.01"
                min="0"
                disabled={!isConnected}
              />
              <div className="text-xs text-gray-500 mt-1">
                {isConnected ? 'Enter SOL amount to bet' : 'Connect wallet to place bets'}
              </div>
            </div>

            {/* Order Summary */}
            {solAmount && parseFloat(solAmount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm border border-gray-200">
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Order Summary</span>
                  <span>{solAmount} SOL</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Leverage</span>
                  <span className="text-blue-600 font-semibold">{leverage[0]}x</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Position Size</span>
                  <span className="text-gray-900 font-semibold">{(parseFloat(solAmount) * leverage[0]).toFixed(2)} SOL</span>
                </div>
              </div>
            )}

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
