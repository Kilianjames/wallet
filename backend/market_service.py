from polymarket_client import PolymarketClient
from typing import List, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

class MarketService:
    def __init__(self):
        self.client = PolymarketClient()
    
    def get_trending_markets(self, limit: int = 200) -> List[Dict]:
        """Get trending markets from Polymarket using Events API"""
        try:
            # Use events API for active markets - fetch more to get variety
            events_data = self.client.get_events(limit=limit)
            
            # Transform event data to market format
            transformed_markets = []
            for event in events_data:
                try:
                    # Get all markets from the event
                    markets = event.get('markets', [])
                    if not markets or len(markets) == 0:
                        logger.debug(f"Skipping event {event.get('id')} - no markets")
                        continue
                    
                    # Check if this is a multi-outcome event (multiple markets)
                    if len(markets) > 1:
                        # Multi-outcome market - group all outcomes
                        outcomes = []
                        for market in markets:
                            try:
                                outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
                                if isinstance(outcome_prices, str):
                                    outcome_prices = json.loads(outcome_prices)
                                
                                if not outcome_prices or len(outcome_prices) == 0:
                                    outcome_prices = ["0.5", "0.5"]
                                
                                yes_price = float(outcome_prices[0]) if outcome_prices[0] not in ["0", "0.0"] else 0.01
                                
                                outcome_title = market.get('groupItemTitle', market.get('question', ''))
                                if not outcome_title or outcome_title == "0":
                                    # Try to extract from question
                                    question = market.get('question', '')
                                    if 'will' in question.lower() and '?' in question:
                                        outcome_title = question.split('will')[1].split('?')[0].strip() if 'will' in question.lower() else question
                                    else:
                                        outcome_title = question
                                
                                try:
                                    token_ids_str = market.get('clobTokenIds', '[]')
                                    if isinstance(token_ids_str, str):
                                        token_ids = json.loads(token_ids_str)
                                    else:
                                        token_ids = token_ids_str
                                except (json.JSONDecodeError, TypeError):
                                    token_ids = []
                                
                                outcomes.append({
                                    'title': outcome_title,
                                    'price': yes_price,
                                    'token_id': token_ids[0] if token_ids and len(token_ids) > 0 else '',
                                    'market_id': market.get('id', '')
                                })
                            except Exception as e:
                                logger.warning(f"Error parsing outcome in multi-market: {e}")
                                continue
                        
                        transformed_market = {
                            'id': str(event.get('id', '')),
                            'title': event.get('title', ''),
                            'category': self._get_category_from_event(event),
                            'is_multi_outcome': True,
                            'outcomes': outcomes,
                            'volume': float(event.get('volume', 0)),
                            'liquidity': float(event.get('liquidity', 0)),
                            'endDate': event.get('endDate', '2025-12-31')[:10],
                            'image': event.get('image', event.get('icon', '')),
                            'change24h': self._calculate_change(event),
                            'slug': event.get('slug', ''),
                        }
                        transformed_markets.append(transformed_market)
                    else:
                        # Single outcome (YES/NO) market
                        market = markets[0]
                        
                        outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
                        if isinstance(outcome_prices, str):
                            outcome_prices = json.loads(outcome_prices)
                        
                        yes_price = float(outcome_prices[0]) if outcome_prices and outcome_prices[0] not in ["0", "0.0"] else 0.5
                        
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
                            'is_multi_outcome': False,
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
                    logger.error(f"Error transforming event {event.get('id', 'unknown')}: {e}", exc_info=True)
                    continue
            
            return transformed_markets[:limit]
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
            logger.info(f"Calling Polymarket CLOB API for orderbook: token_id={token_id}")
            orderbook = self.client.get_orderbook(token_id)
            if not orderbook:
                logger.warning(f"Polymarket returned no orderbook data for token_id={token_id}")
                return None
            
            logger.info(f"Raw orderbook received: {len(orderbook.get('bids', []))} bids, {len(orderbook.get('asks', []))} asks")
            
            # Transform orderbook to our format
            bids = []
            asks = []
            
            for bid in orderbook.get('bids', [])[:10]:
                try:
                    price = float(bid.get('price', 0))
                    size = float(bid.get('size', 0))
                    if price > 0 and size > 0:  # Only include valid orders
                        bids.append({
                            'price': price,
                            'size': size,
                            'total': 0
                        })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing bid: {e}")
                    continue
            
            for ask in orderbook.get('asks', [])[:10]:
                try:
                    price = float(ask.get('price', 0))
                    size = float(ask.get('size', 0))
                    if price > 0 and size > 0:  # Only include valid orders
                        asks.append({
                            'price': price,
                            'size': size,
                            'total': 0
                        })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing ask: {e}")
                    continue
            
            # Calculate cumulative totals
            cumulative = 0
            for bid in bids:
                cumulative += bid['size']
                bid['total'] = cumulative
            
            cumulative = 0
            for ask in asks:
                cumulative += ask['size']
                ask['total'] = cumulative
            
            logger.info(f"Transformed orderbook: {len(bids)} bids, {len(asks)} asks")
            
            return {
                'bids': bids,
                'asks': asks,
                'timestamp': orderbook.get('timestamp', None)  # Include API timestamp if available
            }
        except Exception as e:
            logger.error(f"Error getting orderbook for token_id={token_id}: {e}", exc_info=True)
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
        
    
    def get_markets_by_category(self, category: str, limit: int = 100) -> List[Dict]:
        """Get markets filtered by category"""
        try:
            # Fetch all markets first
            all_markets = self.get_trending_markets(limit=200)
            
            # Filter by category
            if category.lower() == 'all':
                return all_markets[:limit]
            
            filtered = [m for m in all_markets if m.get('category', '').lower() == category.lower()]
            return filtered[:limit]
        except Exception as e:
            logger.error(f"Error getting markets by category: {e}")
            return []

    def get_live_orderbook(self, token_id: str) -> Optional[Dict]:
        """Get live orderbook data"""
        try:
            return self.client.get_orderbook(token_id)
        except Exception as e:
            logger.error(f"Error getting live orderbook: {e}")
            return None
    
    def get_price_chart_data(self, token_id: str, interval: str = "1h") -> List[Dict]:
        """Get price history for chart"""
        try:
            history = self.client.get_price_history(token_id, interval)
            # Transform to chart-friendly format
            chart_data = []
            for item in history:
                try:
                    chart_data.append({
                        'timestamp': item.get('t', 0),
                        'price': float(item.get('p', 0)),
                        'date': item.get('t', 0) * 1000  # Convert to milliseconds for JS
                    })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing price data: {e}")
                    continue
            return chart_data
        except Exception as e:
            logger.error(f"Error getting price chart data: {e}")
            return []

        except Exception as e:
            logger.error(f"Error getting markets by category: {e}")
            return []
    
    def get_trending_only(self, limit: int = 50) -> List[Dict]:
        """Get only the most trending markets by liquidity and volume"""
        try:
            events_data = self.client.get_trending_events(limit=limit)
            return self.get_trending_markets(limit=limit)
        except Exception as e:
            logger.error(f"Error getting trending markets: {e}")
            return []

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
