# Polynator Perp DEX - API Contracts & Integration Plan

## Overview
Polynator is a perpetual DEX for Polymarket prediction markets, allowing users to trade with leverage on trending events.

## Current Status
✅ Frontend-only implementation with mocked data
⏳ Backend implementation pending Polymarket API integration

---

## Mock Data Structure (mockData.js)

### Markets
```javascript
{
  id: string,
  title: string,
  category: 'Crypto' | 'Sports' | 'Politics' | 'Economics',
  yesPrice: number (0-1),
  noPrice: number (0-1),
  volume: number,
  liquidity: number,
  endDate: string (ISO date),
  image: string (URL),
  change24h: number (percentage)
}
```

### Positions
```javascript
{
  id: string,
  marketId: string,
  marketTitle: string,
  side: 'LONG' | 'SHORT',
  entryPrice: number (0-1),
  currentPrice: number (0-1),
  size: number (USDC),
  leverage: number (1-10),
  liquidationPrice: number (0-1),
  pnl: number (USDC),
  pnlPercent: number,
  openedAt: string (ISO timestamp)
}
```

### Orders
```javascript
{
  id: string,
  marketId: string,
  marketTitle: string,
  type: 'MARKET' | 'LIMIT',
  side: 'LONG' | 'SHORT',
  price: number (0-1),
  size: number (USDC),
  filled: number (percentage),
  status: 'OPEN' | 'FILLED' | 'CANCELLED',
  createdAt: string (ISO timestamp)
}
```

---

## Backend API Endpoints (To Be Implemented)

### Markets
- `GET /api/markets` - Get all markets
- `GET /api/markets/:id` - Get specific market
- `GET /api/markets/trending` - Get trending markets
- `GET /api/orderbook/:marketId` - Get orderbook for market
- `GET /api/chart/:marketId` - Get chart data for market

### Trading
- `POST /api/orders` - Place new order
  ```javascript
  Body: {
    marketId: string,
    side: 'LONG' | 'SHORT',
    type: 'MARKET' | 'LIMIT',
    price?: number,
    size: number,
    leverage: number
  }
  ```
- `DELETE /api/orders/:orderId` - Cancel order
- `POST /api/positions/close/:positionId` - Close position

### Portfolio
- `GET /api/positions` - Get user's open positions
- `GET /api/orders` - Get user's open orders
- `GET /api/history` - Get user's trade history
- `GET /api/balance` - Get user's account balance

### User/Wallet
- `POST /api/auth/connect` - Connect wallet
- `GET /api/user/profile` - Get user profile

---

## Polymarket API Integration Plan

### Phase 1: Market Data
1. Integrate Polymarket API to fetch trending markets
2. Replace mock market data with real-time data
3. Implement websocket connections for live price updates

### Phase 2: Trading Engine
1. Build order management system
2. Implement leverage calculations
3. Add liquidation price calculations
4. Position management (open/close)

### Phase 3: User Authentication
1. Implement wallet connection (MetaMask, WalletConnect)
2. User session management
3. Balance tracking

### Phase 4: Backend Features
1. Order book management
2. Trade history tracking
3. PnL calculations
4. Risk management (liquidations)

---

## Database Models (MongoDB)

### User
```javascript
{
  _id: ObjectId,
  walletAddress: string,
  balance: number,
  createdAt: Date,
  lastLoginAt: Date
}
```

### Position
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  marketId: string,
  marketTitle: string,
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  currentPrice: number,
  size: number,
  leverage: number,
  liquidationPrice: number,
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED',
  openedAt: Date,
  closedAt?: Date,
  pnl?: number
}
```

### Order
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  marketId: string,
  marketTitle: string,
  type: 'MARKET' | 'LIMIT',
  side: 'LONG' | 'SHORT',
  price: number,
  size: number,
  filled: number,
  status: 'OPEN' | 'FILLED' | 'CANCELLED',
  createdAt: Date,
  filledAt?: Date
}
```

### Trade
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  positionId: ObjectId,
  marketTitle: string,
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  size: number,
  pnl: number,
  closedAt: Date
}
```

---

## Frontend-Backend Integration Points

### Trading.jsx
- Replace `mockOrderbook` with API call: `GET /api/orderbook/:marketId`
- Replace `chartData` with API call: `GET /api/chart/:marketId`
- Connect `handlePlaceOrder` to: `POST /api/orders`

### Markets.jsx
- Replace `trendingMarkets` with API call: `GET /api/markets/trending`
- Add real-time price updates via websocket

### Portfolio.jsx
- Replace `mockPositions` with API call: `GET /api/positions`
- Replace `mockOrders` with API call: `GET /api/orders`
- Replace `mockTradeHistory` with API call: `GET /api/history`
- Connect close button to: `POST /api/positions/close/:positionId`
- Connect cancel button to: `DELETE /api/orders/:orderId`

### Navbar.jsx
- Connect wallet button to: `POST /api/auth/connect`

---

## Next Steps

1. ✅ Frontend-only implementation (Complete)
2. ⏳ Obtain Polymarket API credentials
3. ⏳ Implement backend API endpoints
4. ⏳ Connect frontend to backend
5. ⏳ Add wallet integration
6. ⏳ Deploy and test

---

## Notes
- All prices in Polymarket are between 0 and 1 (displayed as cents, e.g., 0.70 = $70)
- Leverage multiplies position size (3x leverage on $1000 = $3000 position)
- Liquidation price = entry price - (entry price / leverage)
- PnL calculation: (exit price - entry price) * size * leverage
