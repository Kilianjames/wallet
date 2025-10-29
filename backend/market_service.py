from polymarket_client import PolymarketClient
from typing import List, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

class MarketService:
    def __init__(self):
        self.client = PolymarketClient()
    
    def get_trending_markets(self, limit: int = 30) -> List[Dict]:
        """Get trending markets from Polymarket using Events API"""
        try:
            # Use events API for active markets
            events_data = self.client.get_events(limit=limit)
            
            # Transform event data to market format
            transformed_markets = []
            for event in events_data:
                try:
                    # Get the first market from the event
                    markets = event.get('markets', [])
                    if not markets:
                        continue
                    
                    # Use the first market in the event
                    market = markets[0]
                    
                    # Get outcome prices
                    outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
                    if isinstance(outcome_prices, str):
                        outcome_prices = json.loads(outcome_prices)
                    
                    # Get YES price
                    yes_price = float(outcome_prices[0]) if outcome_prices and outcome_prices[0] not in ["0", "0.0"] else 0.5
                    
                    # Extract token IDs
                    token_ids_str = market.get('clobTokenIds', '[]')
                    if isinstance(token_ids_str, str):
                        token_ids = json.loads(token_ids_str)
                    else:
                        token_ids = token_ids_str
                    
                    token_id = token_ids[0] if token_ids else ''
                    
                    transformed_market = {
                        'id': str(market.get('id', '')),
                        'title': event.get('title', market.get('question', '')),
                        'category': self._get_category_from_event(event),
                        'yesPrice': yes_price,
                        'noPrice': 1 - yes_price,
                        'volume': float(event.get('volume', 0)),
                        'liquidity': float(event.get('liquidity', 0)),
                        'endDate': event.get('endDate', '2025-12-31')[:10],
                        'image': event.get('image', event.get('icon', '')),
                        'change24h': self._calculate_change(event),
                        'slug': market.get('slug', ''),
                        'token_id': token_id
                    }
                    transformed_markets.append(transformed_market)
                except Exception as e:
                    logger.error(f"Error transforming event: {e}")
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
                outcome_prices = json.loads(outcome_prices)
            
            yes_price = float(outcome_prices[0]) if outcome_prices and outcome_prices[0] not in ["0", "0.0"] else 0.5
            
            # Extract token IDs
            token_ids_str = market.get('clobTokenIds', '[]')
            if isinstance(token_ids_str, str):
                token_ids = json.loads(token_ids_str)
            else:
                token_ids = token_ids_str
            
            token_id = token_ids[0] if token_ids else ''
            
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
                'token_id': token_id
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
                    'total': 0
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
    
    def _get_category_from_event(self, event: Dict) -> str:
        """Extract category from event data"""
        category_raw = str(event.get('category', '')).lower()
        tags_raw = event.get('tags', [])
        
        # Convert tags to list of strings
        if isinstance(tags_raw, list):
            tags = [str(t).lower() if not isinstance(t, dict) else str(t.get('label', '')).lower() for t in tags_raw]
        else:
            tags = []
        
        # Check category field first
        if 'sports' in category_raw or any('sport' in t or 'nfl' in t or 'nba' in t or 'mlb' in t or 'soccer' in t or 'football' in t or 'baseball' in t or 'basketball' in t for t in tags):
            return 'Sports'
        elif 'crypto' in category_raw or any('crypto' in t or 'bitcoin' in t or 'ethereum' in t or 'blockchain' in t for t in tags):
            return 'Crypto'
        elif 'econom' in category_raw or any('econom' in t or 'fed' in t or 'rate' in t or 'gdp' in t or 'inflation' in t or 'recession' in t for t in tags):
            return 'Economics'
        elif 'politic' in category_raw or 'election' in category_raw or any('politic' in t or 'election' in t or 'president' in t or 'congress' in t or 'senate' in t for t in tags):
            return 'Politics'
        elif 'pop' in category_raw or 'culture' in category_raw or 'entertainment' in category_raw:
            return 'Entertainment'
        elif 'science' in category_raw or 'technology' in category_raw:
            return 'Science'
        
        # Default based on common patterns in title
        title_lower = str(event.get('title', '')).lower()
        if any(word in title_lower for word in ['nfl', 'nba', 'mlb', 'super bowl', 'world series', 'championship', 'playoff', 'soccer', 'football']):
            return 'Sports'
        elif any(word in title_lower for word in ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth']):
            return 'Crypto'
        elif any(word in title_lower for word in ['fed', 'rate', 'recession', 'gdp', 'economy', 'inflation', 'jobs']):
            return 'Economics'
        
        return 'Politics'  # Default
    
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
        
        return 'Politics'
    
    def _calculate_change(self, data: Dict) -> float:
        """Calculate 24h price change"""
        try:
            change = data.get('oneDayPriceChange', 0)
            if change:
                return round(float(change) * 100, 2)
            return 0.0
        except:
            return 0.0
