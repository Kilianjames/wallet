import React, { useState } from 'react';
import { TrendingUp, TrendingDown, X, Activity, Clock, CheckCircle } from 'lucide-react';
import { mockPositions, mockOrders, mockTradeHistory } from '../mockData';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';

const Portfolio = () => {
  const [positions, setPositions] = useState(mockPositions);
  const [orders, setOrders] = useState(mockOrders);

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

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7fffd4] mb-2">Portfolio</h1>
          <p className="text-gray-400">Manage your positions and view trading history</p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e]">
            <div className="text-gray-400 text-sm mb-2">Total Balance</div>
            <div className="text-3xl font-bold text-[#7fffd4]">$10,000.00</div>
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
            <div className="text-3xl font-bold text-[#7fffd4]">${totalValue.toLocaleString()}</div>
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
            {positions.length === 0 ? (
              <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
                <Activity size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No open positions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e] hover:border-[#7fffd4] transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            position.side === 'LONG' ? 'bg-green-500' : 'bg-red-500'
                          } text-white`}>
                            {position.side}
                          </span>
                          <span className="px-3 py-1 bg-[#1a3a2e] rounded-full text-xs text-[#7fffd4]">
                            {position.leverage}x
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {position.marketTitle}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Opened {new Date(position.openedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold mb-1 ${
                          position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </div>
                        <div className={`text-sm ${
                          position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Size</div>
                        <div className="text-white font-semibold">${position.size}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Entry Price</div>
                        <div className="text-white font-semibold">${(position.entryPrice * 100).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Current Price</div>
                        <div className="text-white font-semibold">${(position.currentPrice * 100).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Liq. Price</div>
                        <div className="text-red-400 font-semibold">${(position.liquidationPrice * 100).toFixed(2)}</div>
                      </div>
                      <div>
                        <Button
                          onClick={() => handleClosePosition(position.id)}
                          variant="destructive"
                          size="sm"
                          className="w-full bg-red-500 hover:bg-red-600"
                        >
                          <X size={14} className="mr-1" />
                          Close
                        </Button>
                      </div>
                    </div>

                    {/* Price Bar */}
                    <div className="relative h-2 bg-[#1a3a2e] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{
                          width: `${((position.currentPrice - position.liquidationPrice) / (1 - position.liquidationPrice)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Open Orders */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
                <Clock size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No open orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#0d2520] rounded-xl p-6 border border-[#1a3a2e] hover:border-[#7fffd4] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.side === 'LONG' ? 'bg-green-500' : 'bg-red-500'
                          } text-white`}>
                            {order.side}
                          </span>
                          <span className="px-3 py-1 bg-[#1a3a2e] rounded-full text-xs text-[#7fffd4]">
                            {order.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {order.marketTitle}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Created {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="border-[#7fffd4] text-[#7fffd4] hover:bg-[#7fffd4] hover:text-[#0a1f1a]"
                      >
                        Cancel Order
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Price</div>
                        <div className="text-white font-semibold">${(order.price * 100).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Size</div>
                        <div className="text-white font-semibold">${order.size}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Filled</div>
                        <div className="text-white font-semibold">{order.filled}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            {mockTradeHistory.length === 0 ? (
              <div className="bg-[#0d2520] rounded-xl p-12 border border-[#1a3a2e] text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No trade history</p>
              </div>
            ) : (
              <div className="bg-[#0d2520] rounded-xl border border-[#1a3a2e] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a3a2e]">
                      <tr>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Market</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Side</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Entry</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Exit</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Size</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">PnL</th>
                        <th className="text-left p-4 text-gray-400 text-sm font-semibold">Closed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTradeHistory.map((trade) => (
                        <tr key={trade.id} className="border-t border-[#1a3a2e] hover:bg-[#1a3a2e] transition-colors">
                          <td className="p-4 text-white">{trade.marketTitle}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.side === 'LONG' ? 'bg-green-500' : 'bg-red-500'
                            } text-white`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="p-4 text-white">${(trade.entryPrice * 100).toFixed(2)}</td>
                          <td className="p-4 text-white">${(trade.exitPrice * 100).toFixed(2)}</td>
                          <td className="p-4 text-white">${trade.size}</td>
                          <td className="p-4">
                            <span className={`font-semibold ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(trade.closedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;
