// Mock data for Polymarket perp trading

export const trendingMarkets = [
  {
    id: '1',
    title: 'Will Bitcoin hit $120,000 in 2025?',
    category: 'Crypto',
    yesPrice: 0.70,
    noPrice: 0.30,
    volume: 28640,
    liquidity: 125000,
    endDate: '2025-12-31',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
    change24h: 5.2
  },
  {
    id: '2',
    title: '2025 NFL Draft - Top QB Pick',
    category: 'Sports',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 465998,
    liquidity: 890000,
    endDate: '2025-04-24',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
    change24h: -2.1
  },
  {
    id: '3',
    title: 'US Recession in 2025?',
    category: 'Economics',
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: 185000,
    liquidity: 520000,
    endDate: '2025-12-31',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    change24h: 8.7
  },
  {
    id: '4',
    title: 'Will Polymarket US go live in 2025?',
    category: 'Crypto',
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: 5427940,
    liquidity: 8200000,
    endDate: '2025-12-31',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    change24h: 12.3
  },
  {
    id: '5',
    title: 'NYC Mayoral Election 2025',
    category: 'Politics',
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 322000000,
    liquidity: 450000000,
    endDate: '2025-11-04',
    image: 'https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=400',
    change24h: -1.5
  },
  {
    id: '6',
    title: 'Ethereum to hit $7,000 in 2025?',
    category: 'Crypto',
    yesPrice: 0.48,
    noPrice: 0.52,
    volume: 95000,
    liquidity: 280000,
    endDate: '2025-12-31',
    image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400',
    change24h: 3.8
  },
  {
    id: '7',
    title: 'Russia-Ukraine Ceasefire by July 2025?',
    category: 'Politics',
    yesPrice: 0.35,
    noPrice: 0.65,
    volume: 45000,
    liquidity: 120000,
    endDate: '2025-07-31',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400',
    change24h: -4.2
  },
  {
    id: '8',
    title: 'Fed Rate Cut by Q2 2025?',
    category: 'Economics',
    yesPrice: 0.62,
    noPrice: 0.38,
    volume: 175000,
    liquidity: 420000,
    endDate: '2025-06-30',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
    change24h: 6.5
  }
];

export const mockPositions = [
  {
    id: 'p1',
    marketId: '1',
    marketTitle: 'Will Bitcoin hit $120,000 in 2025?',
    side: 'LONG',
    entryPrice: 0.65,
    currentPrice: 0.70,
    size: 1000,
    leverage: 3,
    liquidationPrice: 0.45,
    pnl: 150,
    pnlPercent: 15,
    openedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 'p2',
    marketId: '3',
    marketTitle: 'US Recession in 2025?',
    side: 'SHORT',
    entryPrice: 0.50,
    currentPrice: 0.42,
    size: 500,
    leverage: 2,
    liquidationPrice: 0.70,
    pnl: 80,
    pnlPercent: 16,
    openedAt: '2025-01-18T14:20:00Z'
  }
];

export const mockOrders = [
  {
    id: 'o1',
    marketId: '4',
    marketTitle: 'Will Polymarket US go live in 2025?',
    type: 'LIMIT',
    side: 'LONG',
    price: 0.75,
    size: 2000,
    filled: 0,
    status: 'OPEN',
    createdAt: '2025-01-20T09:15:00Z'
  }
];

export const mockTradeHistory = [
  {
    id: 't1',
    marketTitle: '2025 NFL Draft - Top QB Pick',
    side: 'LONG',
    entryPrice: 0.60,
    exitPrice: 0.68,
    size: 800,
    pnl: 64,
    closedAt: '2025-01-19T16:45:00Z'
  },
  {
    id: 't2',
    marketTitle: 'Ethereum to hit $7,000 in 2025?',
    side: 'SHORT',
    entryPrice: 0.52,
    exitPrice: 0.48,
    size: 600,
    pnl: 24,
    closedAt: '2025-01-18T11:30:00Z'
  }
];

export const mockOrderbook = {
  bids: [
    { price: 0.695, size: 2500, total: 2500 },
    { price: 0.690, size: 3200, total: 5700 },
    { price: 0.685, size: 1800, total: 7500 },
    { price: 0.680, size: 4100, total: 11600 },
    { price: 0.675, size: 2900, total: 14500 },
    { price: 0.670, size: 3600, total: 18100 },
    { price: 0.665, size: 2200, total: 20300 },
    { price: 0.660, size: 1500, total: 21800 },
    { price: 0.655, size: 2800, total: 24600 },
    { price: 0.650, size: 3300, total: 27900 }
  ],
  asks: [
    { price: 0.700, size: 2200, total: 2200 },
    { price: 0.705, size: 3100, total: 5300 },
    { price: 0.710, size: 1900, total: 7200 },
    { price: 0.715, size: 2700, total: 9900 },
    { price: 0.720, size: 3400, total: 13300 },
    { price: 0.725, size: 2100, total: 15400 },
    { price: 0.730, size: 2600, total: 18000 },
    { price: 0.735, size: 1800, total: 19800 },
    { price: 0.740, size: 3200, total: 23000 },
    { price: 0.745, size: 2900, total: 25900 }
  ]
};

export const generateChartData = () => {
  const data = [];
  let basePrice = 0.60;
  const now = Date.now();
  
  for (let i = 100; i >= 0; i--) {
    const timestamp = now - (i * 3600000); // hourly data
    const volatility = (Math.random() - 0.5) * 0.02;
    basePrice = Math.max(0.3, Math.min(0.85, basePrice + volatility));
    
    data.push({
      time: timestamp,
      price: basePrice,
      volume: Math.random() * 10000 + 5000
    });
  }
  
  return data;
};
