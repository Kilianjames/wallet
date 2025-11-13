import requests
from typing import List, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

class PolymarketClient:
    def __init__(self):
        self.gamma_base_url = "https://gamma-api.polymarket.com"
        self.clob_base_url = "https://clob.polymarket.com"
        
    def get_markets(self, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Fetch markets from Polymarket Gamma API"""
        try:
            params = {
                "limit": limit,
                "offset": offset,
                "closed": "false",
                "order": "volume24hr",
                "ascending": "false"
            }
                
            response = requests.get(f"{self.gamma_base_url}/markets", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching markets: {e}")
            return []
    
    def get_events(self, limit: int = 100, offset: int = 0, tag: Optional[str] = None) -> List[Dict]:
        """Fetch events from Polymarket - better for active markets"""
        try:
            params = {
                "limit": limit,
                "offset": offset,
                "closed": "false",
                "archived": "false",
                "order": "volume24hr",
                "ascending": "false"
            }
            
            # Add tag filter if provided (for categories)
            if tag:
                params["tag"] = tag
            
            response = requests.get(f"{self.gamma_base_url}/events", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching events: {e}")
            return []
    
    def get_trending_events(self, limit: int = 50) -> List[Dict]:
        """Fetch trending events from Polymarket"""
        try:
            params = {
                "limit": limit,
                "closed": "false",
                "archived": "false",
                "order": "liquidity",
                "ascending": "false"
            }
            
            response = requests.get(f"{self.gamma_base_url}/events", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching trending events: {e}")
            return []
    
    def get_market_by_slug(self, slug: str) -> Optional[Dict]:
        """Fetch a specific market by its slug"""
        try:
            response = requests.get(f"{self.gamma_base_url}/markets/{slug}", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching market {slug}: {e}")
            return None
    
    def get_orderbook(self, token_id: str) -> Optional[Dict]:
        """Fetch orderbook for a specific token"""
        try:
            url = f"{self.clob_base_url}/book"
            params = {"token_id": token_id}
            logger.info(f"GET {url} with params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            logger.info(f"Orderbook API response status: {response.status_code}")
            response.raise_for_status()
            
            data = response.json()
            logger.debug(f"Orderbook API response preview: bids={len(data.get('bids', []))}, asks={len(data.get('asks', []))}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error fetching orderbook for token_id={token_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching orderbook for token_id={token_id}: {e}", exc_info=True)
            return None
    
    def get_price_history(self, token_id: str, interval: str = "1h") -> List[Dict]:
        """Fetch price history for a token"""
        try:
            url = f"{self.clob_base_url}/prices-history"
            params = {
                "market": token_id,
                "interval": interval,
                "fidelity": "60"  # 60 data points
            }
            logger.info(f"GET {url} with params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            logger.info(f"Price history API response status: {response.status_code}")
            response.raise_for_status()
            
            data = response.json()
            history = data.get('history', [])
            logger.info(f"Price history API response: {len(history)} data points")
            return history
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error fetching price history for token_id={token_id}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching price history for token_id={token_id}: {e}", exc_info=True)
            return []
    
    def get_prices(self, token_ids: List[str]) -> Dict:
        """Fetch prices for multiple tokens"""
        try:
            params_list = []
            for token_id in token_ids:
                params_list.append({"token_id": token_id, "side": "BUY"})
                params_list.append({"token_id": token_id, "side": "SELL"})
            
            response = requests.post(
                f"{self.clob_base_url}/prices",
                json={"params": params_list},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching prices: {e}")
            return {}
