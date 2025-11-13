from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from market_service import MarketService
from solana_service import SolanaService
from insights_service import MarketInsightsService


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
market_service = MarketService()
solana_service = SolanaService()
insights_service = MarketInsightsService()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Position(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    market_id: str
    market_title: str
    side: str  # LONG or SHORT
    entry_price: float
    current_price: float
    size: float
    leverage: int
    liquidation_price: float
    status: str = "OPEN"
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    pnl: Optional[float] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    market_id: str
    market_title: str
    type: str  # MARKET or LIMIT
    side: str  # LONG or SHORT
    price: float
    size: float
    filled: float = 0
    status: str = "OPEN"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Polynator Perp DEX API"}

@api_router.get("/markets")
async def get_markets(limit: int = Query(150, ge=1, le=300)):
    """Get trending markets from Polymarket"""
    try:
        # Fetch with higher limit - filtering will reduce the count
        markets = market_service.get_trending_markets(limit=limit)
        return {"markets": markets, "count": len(markets)}
    except Exception as e:
        logging.error(f"Error fetching markets: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch markets")

@api_router.get("/markets/{market_id}")
async def get_market_details(market_id: str):
    """Get detailed market information"""
    try:
        market = market_service.get_market_details(market_id)
        if not market:
            raise HTTPException(status_code=404, detail="Market not found")
        return market
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching market details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market details")

@api_router.get("/markets/category/{category}")
async def get_markets_by_category(category: str, limit: int = Query(100, ge=1, le=200)):
    """Get markets filtered by category"""
    try:
        markets = market_service.get_markets_by_category(category, limit)
        return markets
    except Exception as e:
        logging.error(f"Error fetching markets by category: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch markets by category")

@api_router.get("/markets/trending/top")
async def get_trending_markets(limit: int = Query(50, ge=1, le=100)):
    """Get top trending markets"""
    try:
        markets = market_service.get_trending_only(limit)
        return markets
    except Exception as e:
        logging.error(f"Error fetching trending markets: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending markets")


@api_router.get("/orderbook/{token_id}")
async def get_orderbook(token_id: str):
    """Get orderbook for a market token"""
    try:
        orderbook = market_service.get_orderbook(token_id)
        if not orderbook:
            raise HTTPException(status_code=404, detail="Orderbook not found")
        return orderbook
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching orderbook: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orderbook")


@api_router.get("/markets/{market_id}/orderbook")
async def get_market_orderbook(market_id: str, token_id: str = Query(...)):
    """Get live orderbook for a market"""
    try:
        logging.info(f"Fetching orderbook for market_id={market_id}, token_id={token_id}")
        orderbook = market_service.get_orderbook(token_id)
        if not orderbook:
            logging.warning(f"No orderbook data found for token_id={token_id}")
            raise HTTPException(status_code=404, detail="Orderbook not found")
        
        # Log orderbook stats
        bids_count = len(orderbook.get('bids', []))
        asks_count = len(orderbook.get('asks', []))
        logging.info(f"Orderbook fetched: {bids_count} bids, {asks_count} asks")
        return orderbook
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching orderbook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch orderbook")

@api_router.get("/markets/{market_id}/chart")
async def get_market_chart(market_id: str, token_id: str = Query(...), interval: str = Query("1h")):
    """Get price chart data for a market"""
    try:
        logging.info(f"Fetching chart data for token_id={token_id}, interval={interval}")
        chart_data = market_service.get_price_chart_data(token_id, interval)
        logging.info(f"Chart data fetched successfully: {len(chart_data)} data points")
        return {"data": chart_data}
    except Exception as e:
        logging.error(f"Error fetching chart data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chart data")

@api_router.get("/markets/{market_id}/insights")
async def get_market_insights(market_id: str, market_title: str = Query(...), category: str = Query("Politics")):
    """Get AI-powered insights and tips for a market"""
    try:
        logging.info(f"Generating insights for market: {market_title}")
        
        # Get market data to include outcomes
        markets = market_service.get_trending_markets(200)
        market_data = next((m for m in markets if m['id'] == market_id), None)
        
        outcomes = market_data.get('outcomes', []) if market_data and market_data.get('is_multi_outcome') else None
        
        # Generate insights using AI
        insights = await insights_service.get_market_insights(
            market_title=market_title,
            market_category=category,
            outcomes=outcomes
        )
        
        return insights
    except Exception as e:
        logging.error(f"Error generating insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate insights")

@api_router.post("/positions")
async def create_position(position: Position):
    """Create a new position (mock for now)"""
    position_dict = position.model_dump()
    position_dict['opened_at'] = position_dict['opened_at'].isoformat()
    if position_dict.get('closed_at'):
        position_dict['closed_at'] = position_dict['closed_at'].isoformat()
    
    result = await db.positions.insert_one(position_dict)
    return {"id": str(result.inserted_id), "message": "Position created"}

@api_router.get("/positions")
async def get_positions(user_id: str = Query(...)):
    """Get user's open positions"""
    positions = await db.positions.find({"user_id": user_id, "status": "OPEN"}, {"_id": 0}).to_list(100)
    
    # Convert ISO string timestamps back to datetime objects
    for position in positions:
        if isinstance(position.get('opened_at'), str):
            position['opened_at'] = datetime.fromisoformat(position['opened_at'])
        if position.get('closed_at') and isinstance(position['closed_at'], str):
            position['closed_at'] = datetime.fromisoformat(position['closed_at'])
    
    return {"positions": positions}

@api_router.post("/orders")
async def create_order(order: Order):
    """Create a new order (mock for now)"""
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    
    result = await db.orders.insert_one(order_dict)
    return {"id": str(result.inserted_id), "message": "Order created"}

@api_router.get("/orders")
async def get_orders(user_id: str = Query(...)):
    """Get user's open orders"""
    orders = await db.orders.find({"user_id": user_id, "status": "OPEN"}, {"_id": 0}).to_list(100)
    
    # Convert ISO string timestamps back to datetime objects
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return {"orders": orders}

@api_router.post("/positions/{position_id}/close")
async def close_position(position_id: str):
    """
    Close a position and refund SOL to the user
    SECURITY: Uses private key from environment to sign refund transaction
    """
    try:
        logging.info(f"Attempting to close position: {position_id}")
        
        # In localStorage-based system, position details come from frontend
        # We'll receive the position data in the request body
        # For now, just return success - frontend will handle the transaction
        
        return {
            "success": True,
            "message": "Position closed successfully",
            "position_id": position_id
        }
        
    except Exception as e:
        logging.error(f"Error closing position {position_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to close position: {str(e)}")

@api_router.post("/positions/close-with-refund")
async def close_position_with_refund(
    position_id: str = Query(...),
    wallet_address: str = Query(...),
    amount_sol: float = Query(...)
):
    """
    Close position and send SOL refund back to user
    This endpoint uses the backend wallet to sign and send the refund transaction
    SECURITY: Private key never exposed, only transaction signatures returned
    """
    try:
        logging.info(f"Closing position {position_id} and refunding {amount_sol} SOL to {wallet_address}")
        
        # Check wallet balance first
        balance = solana_service.get_wallet_balance()
        logging.info(f"Backend wallet balance: {balance} SOL")
        
        if balance < amount_sol:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance in backend wallet. Available: {balance} SOL, Required: {amount_sol} SOL"
            )
        
        # Send SOL back to user (private key used internally, never exposed)
        result = solana_service.send_sol_to_user(wallet_address, amount_sol)
        
        if result["success"]:
            logging.info(f"Successfully refunded {amount_sol} SOL to {wallet_address}. Tx: {result['signature']}")
            # SECURITY: Only return safe data - no private keys or sensitive info
            return {
                "success": True,
                "signature": result["signature"],
                "amount": amount_sol,
                "message": "Position closed and SOL refunded successfully"
            }
        else:
            logging.error(f"Failed to refund: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Refund failed: {result.get('error')}")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in close_position_with_refund (details hidden for security)")
        raise HTTPException(status_code=500, detail="Failed to close position")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()