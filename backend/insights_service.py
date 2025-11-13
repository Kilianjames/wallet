"""
Market Insights Service - AI-powered tips and news for prediction markets
"""
import os
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import httpx

logger = logging.getLogger(__name__)

class MarketInsightsService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
        logger.info("Market Insights Service initialized with Emergent LLM")
    
    async def get_market_insights(self, market_title: str, market_category: str, outcomes: list = None) -> dict:
        """
        Generate AI-powered insights for a prediction market
        Uses real-time web search for accurate, up-to-date analysis
        
        Args:
            market_title: Title of the prediction market
            market_category: Category (Crypto, Sports, Politics, etc.)
            outcomes: List of possible outcomes (for multi-outcome markets)
            
        Returns:
            dict with analysis, tips, and sentiment
        """
        try:
            # First, get real-time context using web search
            search_context = await self._fetch_market_context(market_title, market_category)
            
            # Create chat instance with system message emphasizing data-driven analysis
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"insights_{market_title[:20]}",
                system_message="""You are an expert prediction market analyst. Use ONLY the provided real-time data and current probabilities to give accurate insights.
                DO NOT make predictions without data. If data is limited, acknowledge uncertainty.
                Focus on:
                1. What the DATA says (not speculation)
                2. Current market sentiment from probabilities
                3. Key known factors only
                Keep under 150 words, bullet points preferred."""
            ).with_model("openai", "gpt-4o-mini")
            
            # Build the analysis prompt with real-time context
            if outcomes and len(outcomes) > 1:
                # Sort by probability for multi-outcome
                sorted_outcomes = sorted(outcomes, key=lambda x: x.get('price', 0), reverse=True)
                outcomes_text = "\n".join([f"- {o.get('title', 'Unknown')}: {int(o.get('price', 0)*100)}% probability" for o in sorted_outcomes[:8]])
                
                prompt = f"""Analyze this prediction market with REAL-TIME DATA:

Market: {market_title}
Category: {market_category}

CURRENT MARKET PROBABILITIES (from live trading):
{outcomes_text}

REAL-TIME CONTEXT:
{search_context}

Based on this DATA, provide:
1. Key Insight (what the probabilities tell us)
2. Best Value Bet (considering probability vs actual likelihood)
3. Risk Note (1 sentence)

Be specific and data-driven. Don't predict - analyze what the data shows."""
            else:
                prompt = f"""Analyze this prediction market with REAL-TIME DATA:

Market: {market_title}
Category: {market_category}

REAL-TIME CONTEXT:
{search_context}

Based on this DATA, provide:
1. Key Insight
2. Betting Tip
3. Risk Note

Be specific and data-driven."""
            
            # Send message and get response
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse response into structured format
            analysis_text = response if isinstance(response, str) else str(response)
            
            # Extract sentiment from analysis
            sentiment = self._extract_sentiment(analysis_text)
            
            return {
                "success": True,
                "analysis": analysis_text,
                "sentiment": sentiment,
                "updated_at": "just now"
            }
            
        except Exception as e:
            logger.error(f"Error generating insights for {market_title}: {e}", exc_info=True)
            return {
                "success": False,
                "error": "Failed to generate insights",
                "analysis": "Insights temporarily unavailable. Please try again.",
                "sentiment": "neutral"
            }
    
    async def _fetch_market_context(self, market_title: str, category: str) -> str:
        """
        Fetch real-time context about the market using DuckDuckGo search
        """
        try:
            # Clean the market title for better search results
            # Remove special characters and question marks
            clean_title = market_title.replace("?", "").strip()
            
            # Build search query based on category
            if "election" in clean_title.lower() or "presidential" in clean_title.lower():
                search_query = f"{clean_title} polls latest 2025"
            elif "price" in clean_title.lower() or "crypto" in category.lower():
                search_query = f"{clean_title} price prediction latest"
            elif "sport" in category.lower() or "nfl" in clean_title.lower() or "nba" in clean_title.lower():
                search_query = f"{clean_title} odds betting latest"
            else:
                search_query = f"{clean_title} latest news"
            
            # Use httpx to make a simple search request
            # Note: Using DuckDuckGo Instant Answer API (no key required)
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "https://api.duckduckgo.com/",
                    params={
                        "q": search_query,
                        "format": "json",
                        "no_html": 1
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    abstract = data.get("Abstract", "")
                    related_topics = data.get("RelatedTopics", [])
                    
                    context_parts = []
                    if abstract:
                        context_parts.append(f"Latest info: {abstract[:200]}")
                    
                    # Add related context if available
                    for topic in related_topics[:2]:
                        if isinstance(topic, dict) and "Text" in topic:
                            context_parts.append(topic["Text"][:150])
                    
                    if context_parts:
                        return " | ".join(context_parts)
            
            return "Limited external data. Focus on current market probabilities and known factors."
            
        except Exception as e:
            logger.warning(f"Could not fetch external context: {e}")
            return "Analyze based on current market probabilities and general knowledge."
    
    def _extract_sentiment(self, text: str) -> str:
        """Extract sentiment from analysis text"""
        text_lower = text.lower()
        
        positive_words = ['bullish', 'likely', 'strong', 'favor', 'positive', 'increasing', 'high probability', 'value', 'undervalued']
        negative_words = ['bearish', 'unlikely', 'weak', 'against', 'negative', 'decreasing', 'low probability', 'overvalued', 'risky']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "bullish"
        elif negative_count > positive_count:
            return "bearish"
        else:
            return "neutral"
