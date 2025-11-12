import React, { useState } from 'react';
import { TrendingUp, TrendingDown, X, Activity, Clock, CheckCircle, Info, Lock } from 'lucide-react';
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
  const { isConnected, connect, address } = useWallet();
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
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

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#7fffd4] mb-2">Portfolio</h1>
            <p className="text-gray-400">Manage your positions and view trading history</p>
          </div>
          
          {/* How Trading Works Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#1a3a2e] hover:bg-[#254538] text-[#7fffd4] border border-[#7fffd4]">
                <Info size={18} className="mr-2" />
                How Trading Works
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d2520] border-[#7fffd4] text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[#7fffd4]">How to Trade on Polymarket</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Understanding Long and Short positions on prediction markets
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="bg-[#1a3a2e] rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-400 mb-2">📈 LONG Position (Buy YES)</h3>
                  <p className="text-gray-300 mb-2">
                    You believe the event WILL happen. Buy YES tokens at current price (e.g., $0.70).
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1">
                    <li>If event happens: Each YES token = $1.00 USDC</li>
                    <li>If event doesn't happen: Token = $0.00</li>
                    <li>Profit: $1.00 - purchase price</li>
                    <li>Can sell tokens anytime before resolution</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a3a2e] rounded-lg p-4">
                  <h3 className="text-lg font-bold text-red-400 mb-2">📉 SHORT Position (Buy NO)</h3>
                  <p className="text-gray-300 mb-2">
                    You believe the event WON'T happen. Buy NO tokens at current price (e.g., $0.30).
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1">
                    <li>If event doesn't happen: Each NO token = $1.00 USDC</li>
                    <li>If event happens: Token = $0.00</li>
                    <li>Profit: $1.00 - purchase price</li>
                    <li>Can sell tokens anytime before resolution</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a3a2e] rounded-lg p-4">
                  <h3 className="text-lg font-bold text-[#7fffd4] mb-2">💡 Example Trade</h3>
                  <p className="text-gray-300 mb-2">
                    Market: "Will Bitcoin hit $120k in 2025?"<br/>
                    YES price: $0.70 | NO price: $0.30
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="border border-green-500/30 rounded p-2">
                      <div className="text-green-400 font-bold">Buy YES ($0.70)</div>
                      <div className="text-sm text-gray-400">If YES: Profit $0.30/token</div>
                      <div className="text-sm text-gray-400">If NO: Lose $0.70/token</div>
                    </div>
                    <div className="border border-red-500/30 rounded p-2">
                      <div className="text-red-400 font-bold">Buy NO ($0.30)</div>
                      <div className="text-sm text-gray-400">If NO: Profit $0.70/token</div>
                      <div className="text-sm text-gray-400">If YES: Lose $0.30/token</div>
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
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Total Balance</div>
            <div className="text-3xl font-bold text-[#7fffd4]">$0.00</div>
            <div className="text-xs text-gray-500 mt-1">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Total PnL</div>
            <div className={`text-3xl font-bold ${
              totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Open Positions</div>
            <div className="text-3xl font-bold text-[#7fffd4]">{positions.length}</div>
          </div>
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Position Value</div>
            <div className="text-3xl font-bold text-[#7fffd4]">${totalValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="bg-[#0d2520] border border-[#1a3a2e] mb-6">
            <TabsTrigger value="positions" className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]">
              <Activity size={16} className="mr-2" />
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]">
              <Clock size={16} className="mr-2" />
              Open Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#7fffd4] data-[state=active]:text-[#0a1f1a]">
              <CheckCircle size={16} className="mr-2" />
              Trade History
            </TabsTrigger>
          </TabsList>

          {/* Open Positions */}
          <TabsContent value="positions">
            <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
              <Activity size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">No open positions</p>
              <p className="text-gray-500 text-sm">Start trading to see your positions here</p>
            </div>
          </TabsContent>

          {/* Open Orders */}
          <TabsContent value="orders">
            <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
              <Clock size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">No open orders</p>
              <p className="text-gray-500 text-sm">Your pending orders will appear here</p>
            </div>
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">No trade history</p>
              <p className="text-gray-500 text-sm">Your completed trades will be shown here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;
