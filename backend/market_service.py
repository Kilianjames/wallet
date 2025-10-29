from polymarket_client import PolymarketClient
from typing import List, Dict, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class MarketService:
    def __init__(self):
        self.client = PolymarketClient()
    
    def get_trending_markets(self, limit: int = 30) -> List[Dict]:
        """Get trending markets from Polymarket"""
        try:
            markets_data = self.client.get_markets(limit=limit * 2)  # Fetch more to filter
            
            # Filter for active markets only
            active_markets = [m for m in markets_data if m.get('active', False) and not m.get('closed', False)]
            
            # Transform Polymarket data to our format
            transformed_markets = []
            for market in active_markets[:limit]:
                try:
                    # Get outcome prices
                    outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
                    if isinstance(outcome_prices, str):
                        import json
                        outcome_prices = json.loads(outcome_prices)
                    
                    # Get YES price (first price)
                    yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 and outcome_prices[0] != "0" else 0.5
                    
                    # Extract category/tags
                    category = self._get_category_from_market(market)
                    
                    transformed_market = {
                        'id': str(market.get('id', '')),
                        'title': market.get('question', ''),
                        'category': category,
                        'yesPrice': yes_price,
                        'noPrice': 1 - yes_price,
                        'volume': float(market.get('volumeNum', 0)),
                        'liquidity': float(market.get('liquidityNum', 0)),
                        'endDate': market.get('endDateIso', '2025-12-31'),
                        'image': market.get('image', market.get('icon', '')),
                        'change24h': self._calculate_change(market),
                        'slug': market.get('slug', ''),
                        'token_ids': market.get('clobTokenIds', '')
                    }
                    transformed_markets.append(transformed_market)
                except Exception as e:
                    logger.error(f"Error transforming market: {e}")
                    continue
            
            return transformed_markets
        except Exception as e:
            logger.error(f"Error getting trending markets: {e}")
            return []
    
    def get_market_details(self, market_id: str) -> Optional[Dict]:
        """Get detailed market information"""
        try:
            market = self.client.get_market_by_slug(market_id)
            if not market:
                return None
            
            # Get outcome prices
            outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
            if isinstance(outcome_prices, str):
                import json
                outcome_prices = json.loads(outcome_prices)
            
            yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 and outcome_prices[0] != "0" else 0.5
            
            return {
                'id': str(market.get('id', '')),
                'title': market.get('question', ''),
                'category': self._get_category_from_market(market),
                'yesPrice': yes_price,
                'noPrice': 1 - yes_price,
                'volume': float(market.get('volumeNum', 0)),
                'liquidity': float(market.get('liquidityNum', 0)),
                'endDate': market.get('endDateIso', '2025-12-31'),
                'image': market.get('image', market.get('icon', '')),
                'description': market.get('description', ''),
                'token_ids': market.get('clobTokenIds', '')
            }
        except Exception as e:
            logger.error(f"Error getting market details: {e}")
            return None
    
    def get_orderbook(self, token_id: str) -> Optional[Dict]:
        """Get orderbook for a market"""
        try:
            orderbook = self.client.get_orderbook(token_id)
            if not orderbook:
                return None
            
            # Transform orderbook to our format
            bids = []
            asks = []
            
            for bid in orderbook.get('bids', [])[:10]:
                bids.append({
                    'price': float(bid.get('price', 0)),
                    'size': float(bid.get('size', 0)),
                    'total': 0  # Calculate cumulative
                })
            
            for ask in orderbook.get('asks', [])[:10]:
                asks.append({
                    'price': float(ask.get('price', 0)),
                    'size': float(ask.get('size', 0)),
                    'total': 0
                })
            
            # Calculate cumulative totals
            cumulative = 0
            for bid in bids:
                cumulative += bid['size']
                bid['total'] = cumulative
            
            cumulative = 0
            for ask in asks:
                cumulative += ask['size']
                ask['total'] = cumulative
            
            return {
                'bids': bids,
                'asks': asks
            }
        except Exception as e:
            logger.error(f"Error getting orderbook: {e}")
            return None
    
    def _get_category_from_market(self, market: Dict) -> str:
        """Extract category from market data"""
        category_raw = market.get('category', '')
        
        category_map = {
            'politics': 'Politics',
            'crypto': 'Crypto',
            'sports': 'Sports',
            'economics': 'Economics',
            'economy': 'Economics',
            'pop-culture': 'Entertainment',
            'entertainment': 'Entertainment',
            'science': 'Science',
            'technology': 'Crypto',
            'us-current-affairs': 'Politics'
        }
        
        for key, value in category_map.items():
            if key in category_raw.lower():
                return value
        
        return 'Politics'  # Default
    
    def _calculate_change(self, market: Dict) -> float:
        """Calculate 24h price change"""
        try:
            change = market.get('oneDayPriceChange', 0)
            return round(float(change) * 100, 2) if change else 0.0
        except:
            return 0.0
