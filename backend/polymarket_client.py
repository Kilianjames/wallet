import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class PolymarketClient:
    def __init__(self):
        self.gamma_base_url = "https://gamma-api.polymarket.com"
        self.clob_base_url = "https://clob.polymarket.com"
        
    def get_markets(self, limit: int = 50, offset: int = 0, tags: Optional[str] = None) -> Dict:
        """Fetch markets from Polymarket Gamma API"""
        try:
            params = {
                "limit": limit,
                "offset": offset,
            }
            if tags:
                params["tags"] = tags
                
            response = requests.get(f"{self.gamma_base_url}/markets", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching markets: {e}")
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
            response = requests.get(f"{self.clob_base_url}/book", params={"token_id": token_id}, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching orderbook for {token_id}: {e}")
            return None
    
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
    
    def get_events(self, limit: int = 20, offset: int = 0) -> List[Dict]:
        """Fetch events from Polymarket"""
        try:
            params = {
                "limit": limit,
                "offset": offset,
            }
            response = requests.get(f"{self.gamma_base_url}/events", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching events: {e}")
            return []
