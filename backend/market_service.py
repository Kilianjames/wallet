from polymarket_client import PolymarketClient
import logging
import json
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class MarketService:
    def __init__(self):
        self.client = PolymarketClient()
    
    def get_trending_markets(self, limit: int = 200) -> List[Dict]:
        """Get trending markets from Polymarket using Events API - ONLY ACTIVE/ONGOING"""
        try:
            from datetime import datetime, timezone, timedelta
            
            # Fetch MORE markets from API since filtering will reduce count significantly
            # Request 2x the desired limit to account for filtering
            fetch_limit = min(limit * 2, 400)
            events_data = self.client.get_events(limit=fetch_limit)
            
            # Get current timestamp for filtering
            current_time = datetime.now(timezone.utc)
            
            # Transform event data to market format
            transformed_markets = []
            for event in events_data:
                try:
                    # Get all markets from the event
                    markets = event.get('markets', [])
                    if not markets or len(markets) == 0:
                        logger.debug(f"Skipping event {event.get('id')} - no markets")
                        continue
                    
                    # CRITICAL: Filter out expired markets - only show ACTIVE/ONGOING
                    # Filter markets ending TODAY or earlier (more strict filtering)
                    end_date_str = event.get('endDate', '')
                    event_title = event.get('title', '')
                    
                    if end_date_str:
                        try:
                            # Parse end date - handle multiple formats
                            if 'T' in end_date_str:
                                # Full ISO8601 format like "2025-12-10T00:00:00Z"
                                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                            else:
                                # Date only format like "2025-11-13" - assume end of day
                                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                                # Add timezone info and set to end of day
                                end_date = end_date.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                            
                            # MORE STRICT: Filter out markets ending in the next 24 hours
                            # Only show markets ending TOMORROW or later (Nov 14+)
                            cutoff_time = current_time + timedelta(days=1)
                            
                            if end_date <= cutoff_time:
                                logger.info(f"Skipping EXPIRED/ENDING-SOON market: {event_title} (ends: {end_date_str})")
                                continue
                        except (ValueError, AttributeError) as e:
                            logger.warning(f"Could not parse end date '{end_date_str}' for event '{event_title}': {e}")
                            # If we can't parse the date, skip the market to be safe
                            logger.info(f"Skipping market with unparseable end date: {event_title}")
                            continue
                    
                    # Also check if market is marked as closed or accepting orders
                    if event.get('closed', False) or event.get('archived', False):
                        logger.info(f"Skipping CLOSED/ARCHIVED market: {event_title}")
                        continue
                    
                    # Check if first market in event has acceptingOrders flag
                    first_market = markets[0] if markets else {}
                    if not first_market.get('acceptingOrders', True):
                        logger.info(f"Skipping market NOT accepting orders: {event_title}")
                        continue
                    
                    # Check if multi-outcome (event has multiple market groups)
                    if len(markets) > 2:
                        # Multi-outcome market
                        outcomes = []
                        for market in markets:
                            try:
                                outcome_prices = market.get('outcomePrices', '["0.5", "0.5"]')
                                if isinstance(outcome_prices, str):
                                    outcome_prices = json.loads(outcome_prices)
                                
                                if not outcome_prices or len(outcome_prices) == 0:
                                    outcome_prices = ["0.5", "0.5"]
                                
                                yes_price = float(outcome_prices[0]) if outcome_prices[0] not in ["0", "0.0"] else 0.01
                                
                                # IMPROVED: Get actual outcome title from market data
                                # Polymarket stores candidate/option names in multiple fields
                                outcome_title = (
                                    market.get('groupItemTitle', '') or 
                                    market.get('description', '') or
                                    market.get('question', '')
                                )
                                
                                # Clean up the title - remove market question if it's duplicated
                                if outcome_title == "0" or not outcome_title.strip():
                                    # Fallback: extract from question
                                    question = market.get('question', '')
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
                                    'title': outcome_title.strip(),
                                    'price': yes_price,
                                    'token_id': token_ids[0] if token_ids and len(token_ids) > 0 else '',
                                    'market_id': market.get('id', '')
                                })
                            except Exception as e:
                                logger.warning(f"Error parsing outcome in multi-market: {e}")
                                continue
                        
                        transformed_market = {
                            'id': str(event.get('id', '')),
                            'title': event_title,
                            'category': self._get_category_from_event(event),
                            'is_multi_outcome': True,
                            'outcomes': outcomes,
                            'volume': float(event.get('volume', 0)),
                            'liquidity': float(event.get('liquidity', 0)),
                            'endDate': event.get('endDate', '2025-12-31'),
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
                            'endDate': event.get('endDate', '2025-12-31'),
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
                'yesPrice': yes_price,
                'noPrice': 1 - yes_price,
                'volume': float(market.get('volume', 0)),
                'liquidity': float(market.get('liquidity', 0)),
                'endDate': market.get('endDate', '2025-12-31'),
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
    
    def get_price_chart_data(self, token_id: str, interval: str = "1h") -> List[Dict]:
        """Get price history for chart"""
        try:
            logger.info(f"Calling Polymarket CLOB API for price history: token_id={token_id}, interval={interval}")
            history = self.client.get_price_history(token_id, interval)
            logger.info(f"Raw price history received: {len(history)} data points")
            
            # Transform to chart-friendly format
            chart_data = []
            for item in history:
                try:
                    timestamp = item.get('t', 0)
                    price = float(item.get('p', 0))
                    
                    if timestamp > 0 and price > 0:  # Only include valid data
                        chart_data.append({
                            'timestamp': timestamp,
                            'price': price,
                            'date': timestamp * 1000  # Convert to milliseconds for JS
                        })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing price data point: {e}")
                    continue
            
            logger.info(f"Transformed chart data: {len(chart_data)} valid points")
            return chart_data
        except Exception as e:
            logger.error(f"Error getting price chart data for token_id={token_id}: {e}", exc_info=True)
            return []
    
    def _get_category_from_event(self, event: Dict) -> str:
        """Extract category from event tags or description"""
        tags = event.get('tags', [])
        if not tags:
            return 'Politics'
        
        tag_lower = tags[0].get('label', '').lower() if tags and len(tags) > 0 else ''
        
        if 'crypto' in tag_lower or 'bitcoin' in tag_lower or 'ethereum' in tag_lower:
            return 'Crypto'
        elif 'sport' in tag_lower or 'nfl' in tag_lower or 'nba' in tag_lower:
            return 'Sports'
        elif 'econ' in tag_lower or 'fed' in tag_lower or 'rate' in tag_lower:
            return 'Economics'
        else:
            return 'Politics'
    
    def _calculate_change(self, event: Dict) -> float:
        """Calculate 24h price change"""
        try:
            # Polymarket provides volume24hr - we can estimate change
            volume = float(event.get('volume', 0))
            volume24h = float(event.get('volume24hr', 0))
            
            if volume > 0 and volume24h > 0:
                # Rough estimate of activity change
                return min(max((volume24h / volume) * 10 - 5, -15), 15)
            return 0.0
        except:
            return 0.0
