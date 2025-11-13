import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X, Activity, Clock, CheckCircle, Info, Lock, Wallet, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import { useWallet } from '../contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const Portfolio = () => {
  const { isConnected, connect, address, publicKey } = useWallet();
  const [positions, setPositions] = useState([]);
  const [markets, setMarkets] = useState({});
  const [loading, setLoading] = useState(true);

  // Load positions and fetch live prices
  useEffect(() => {
    if (!isConnected) return;

    const loadPositions = async () => {
      try {
        const storedPositions = JSON.parse(localStorage.getItem('positions') || '[]');
        // Filter positions for current wallet
        const userPositions = storedPositions.filter(p => p.walletAddress === publicKey);
        setPositions(userPositions);

        // Fetch current market data for live prices
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/markets?limit=100`);
        const data = await response.json();
        const marketsMap = {};
        data.markets.forEach(m => {
          marketsMap[m.id] = m;
        });
        setMarkets(marketsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error loading positions:', error);
        setLoading(false);
      }
    };

    loadPositions();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPositions, 30000);
    return () => clearInterval(interval);
  }, [isConnected, publicKey]);
  
  const [orders, setOrders] = useState([]);

  const totalValue = positions.reduce((sum, pos) => sum + pos.size, 0);

  const handleClosePosition = (positionId) => {
    toast({
      title: 'Position Closed',
      description: 'Your position has been closed successfully',
    });
    setPositions(positions.filter(p => p.id !== positionId));
  };

  const handleCancelOrder = (orderId) => {
    toast({
      title: 'Order Cancelled',
      description: 'Your order has been cancelled',
    });
    setOrders(orders.filter(o => o.id !== orderId));
  };

  // Show locked state if wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio</h1>
            <p className="text-gray-600">Connect your wallet to view your portfolio</p>
          </div>

          {/* Locked State */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-xl p-12 border-2 border-blue-600 max-w-md text-center shadow-lg">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={48} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Portfolio Locked
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view your trading positions, history, and performance
              </p>
              <Button 
                onClick={connect}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
              >
                <Wallet size={20} className="mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total PnL
  const totalPnL = positions.reduce((sum, pos) => {
    const market = markets[pos.marketId];
    if (!market) return sum;
    
    // Get current price - handle both single outcome and multi-outcome markets
    let currentPrice = pos.entryPrice; // fallback
    if (market.is_multi_outcome && market.outcomes) {
      // Find the matching outcome
      const matchingOutcome = market.outcomes.find(o => o.title === pos.outcome);
      if (matchingOutcome) {
        currentPrice = matchingOutcome.price;
      }
    } else {
      // Single outcome market
      currentPrice = market.yesPrice || pos.entryPrice;
    }
    
    const priceDiff = currentPrice - pos.entryPrice;
    const pnl = pos.side === 'LONG' 
      ? priceDiff * pos.amount * pos.leverage
      : -priceDiff * pos.amount * pos.leverage;
    return sum + pnl;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio</h1>
            <p className="text-gray-600">
              {isConnected 
                ? `${positions.length} active position${positions.length !== 1 ? 's' : ''}`
                : 'Connect your wallet to view your portfolio'
              }
            </p>
          </div>
          {isConnected && (
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Total P&L</div>
              <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)} SOL
              </div>
            </div>
          )}
          
          {/* How Trading Works Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600">
                <Info size={18} className="mr-2" />
                How Trading Works
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-blue-600">How to Trade on Polymarket</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Understanding Long and Short positions on prediction markets
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-bold text-green-600 mb-2">📈 LONG Position (Buy YES)</h3>
                  <p className="text-gray-700 mb-2">
                    You believe the event WILL happen. Buy YES tokens at current price (e.g., $0.70).
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>If event happens: Each YES token = $1.00 USDC</li>
                    <li>If event doesn't happen: Token = $0.00</li>
                    <li>Profit: $1.00 - purchase price</li>
                    <li>Can sell tokens anytime before resolution</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-bold text-red-600 mb-2">📉 SHORT Position (Buy NO)</h3>
                  <p className="text-gray-700 mb-2">
                    You believe the event WON'T happen. Buy NO tokens at current price (e.g., $0.30).
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>If event doesn't happen: Each NO token = $1.00 USDC</li>
                    <li>If event happens: Token = $0.00</li>
                    <li>Profit: $1.00 - purchase price</li>
                    <li>Can sell tokens anytime before resolution</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-bold text-blue-600 mb-2">💡 Example Trade</h3>
                  <p className="text-gray-700 mb-2">
                    Market: "Will Bitcoin hit $120k in 2025?"<br/>
                    YES price: $0.70 | NO price: $0.30
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="border border-green-500/30 rounded p-2 bg-green-50">
                      <div className="text-green-600 font-bold">Buy YES ($0.70)</div>
                      <div className="text-sm text-gray-600">If YES: Profit $0.30/token</div>
                      <div className="text-sm text-gray-600">If NO: Lose $0.70/token</div>
                    </div>
                    <div className="border border-red-500/30 rounded p-2 bg-red-50">
                      <div className="text-red-600 font-bold">Buy NO ($0.30)</div>
                      <div className="text-sm text-gray-600">If NO: Profit $0.70/token</div>
                      <div className="text-sm text-gray-600">If YES: Lose $0.30/token</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  Note: YES + NO prices always equal $1.00. This is a prediction market, not a perpetual DEX. 
                  "Leverage" in our interface simulates position sizing, but actual Polymarket trading is 1:1.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Total Balance</div>
            <div className="text-3xl font-bold text-blue-600">$0.00</div>
            <div className="text-xs text-gray-500 mt-1">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Total PnL</div>
            <div className={`text-3xl font-bold ${
              totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Open Positions</div>
            <div className="text-3xl font-bold text-blue-600">{positions.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-600 text-sm mb-2">Position Value</div>
            <div className="text-3xl font-bold text-blue-600">${totalValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="bg-white border border-gray-200 mb-6 shadow-sm">
            <TabsTrigger value="positions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity size={16} className="mr-2" />
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Clock size={16} className="mr-2" />
              Open Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckCircle size={16} className="mr-2" />
              Trade History
            </TabsTrigger>
          </TabsList>

          {/* Open Positions */}
          <TabsContent value="positions">
            {/* Active Positions */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={48} />
              </div>
            ) : positions.length > 0 ? (
              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Active Positions</h2>
                {positions.map((position) => {
                  const market = markets[position.marketId];
                  
                  // Get current price - handle both single outcome and multi-outcome markets
                  let currentPrice = position.entryPrice; // fallback
                  if (market) {
                    if (market.is_multi_outcome && market.outcomes) {
                      // Find the matching outcome
                      const matchingOutcome = market.outcomes.find(o => o.title === position.outcome);
                      if (matchingOutcome) {
                        currentPrice = matchingOutcome.price;
                      }
                    } else {
                      // Single outcome market
                      currentPrice = market.yesPrice || position.entryPrice;
                    }
                  }
                  
                  const priceDiff = currentPrice - position.entryPrice;
                  const pnl = position.side === 'LONG' 
                    ? priceDiff * position.amount * position.leverage
                    : -priceDiff * position.amount * position.leverage;
                  const pnlPercent = ((priceDiff / position.entryPrice) * 100 * position.leverage) * (position.side === 'LONG' ? 1 : -1);

                  return (
                    <div key={position.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              position.side === 'LONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {position.side}
                            </span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                              {position.leverage}x
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{position.marketTitle}</h3>
                          <p className="text-sm text-gray-600">{position.outcome}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold mb-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} SOL
                          </div>
                          <div className={`text-sm font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Amount</div>
                          <div className="text-sm font-semibold text-gray-900">{position.amount} SOL</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Entry Price</div>
                          <div className="text-sm font-semibold text-gray-900">{(position.entryPrice * 100).toFixed(1)}¢</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Current Price</div>
                          <div className={`text-sm font-semibold ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(currentPrice * 100).toFixed(1)}¢
                            {market && <span className="text-xs ml-1">● Live</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Wallet</div>
                          <div className="text-sm font-mono text-gray-900">{position.walletAddress.slice(0, 4)}...{position.walletAddress.slice(-4)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Opened: {new Date(position.timestamp).toLocaleString()}
                        </div>
                        <a 
                          href={`https://solscan.io/tx/${position.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Transaction →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center mb-8">
                <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Positions</h3>
                <p className="text-gray-600 mb-6">Start trading to see your positions here</p>
                <Button 
                  onClick={() => window.location.href = '/markets'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse Markets
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Open Orders */}
          <TabsContent value="orders">
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center shadow-sm">
              <Clock size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-700 text-lg mb-2">No open orders</p>
              <p className="text-gray-500 text-sm">Your pending orders will appear here</p>
            </div>
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center shadow-sm">
              <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-700 text-lg mb-2">No trade history</p>
              <p className="text-gray-500 text-sm">Your completed trades will be shown here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;
