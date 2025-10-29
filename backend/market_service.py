from polymarket_client import PolymarketClient
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class MarketService:
    def __init__(self):
        self.client = PolymarketClient()
    
    def get_trending_markets(self, limit: int = 30) -> List[Dict]:
        """Get trending markets from Polymarket"""
        try:
            markets_data = self.client.get_markets(limit=limit)
            
            # Transform Polymarket data to our format
            transformed_markets = []
            for market in markets_data:
                try:
                    # Extract market data
                    tokens = market.get('tokens', [])
                    if not tokens:
                        continue
                    
                    # Get YES token (first token)
                    yes_token = tokens[0]
                    
                    transformed_market = {
                        'id': market.get('id', ''),
                        'title': market.get('question', ''),
                        'category': self._get_category(market.get('tags', [])),
                        'yesPrice': float(yes_token.get('price', 0.5)),
                        'noPrice': 1 - float(yes_token.get('price', 0.5)),
                        'volume': float(market.get('volume', 0)),
                        'liquidity': float(market.get('liquidity', 0)),
                        'endDate': market.get('end_date_iso', '2025-12-31'),
                        'image': market.get('image', ''),
                        'change24h': self._calculate_change(market),
                        'slug': market.get('slug', ''),
                        'token_id': yes_token.get('token_id', '')
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
            
            tokens = market.get('tokens', [])
            if not tokens:
                return None
            
            yes_token = tokens[0]
            
            return {
                'id': market.get('id', ''),
                'title': market.get('question', ''),
                'category': self._get_category(market.get('tags', [])),
                'yesPrice': float(yes_token.get('price', 0.5)),
                'noPrice': 1 - float(yes_token.get('price', 0.5)),
                'volume': float(market.get('volume', 0)),
                'liquidity': float(market.get('liquidity', 0)),
                'endDate': market.get('end_date_iso', '2025-12-31'),
                'image': market.get('image', ''),
                'description': market.get('description', ''),
                'token_id': yes_token.get('token_id', '')
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
    
    def _get_category(self, tags: List[str]) -> str:
        """Extract category from tags"""
        category_map = {
            'Politics': 'Politics',
            'Crypto': 'Crypto',
            'Sports': 'Sports',
            'Economics': 'Economics',
            'Pop Culture': 'Entertainment',
            'Science': 'Science'
        }
        
        for tag in tags:
            for key, value in category_map.items():
                if key.lower() in tag.lower():
                    return value
        
        return 'Politics'  # Default
    
    def _calculate_change(self, market: Dict) -> float:
        """Calculate 24h price change"""
        # This would require historical data
        # For now, return a placeholder
        import random
        return round(random.uniform(-10, 10), 2)
