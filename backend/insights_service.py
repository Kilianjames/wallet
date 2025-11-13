"""
Market Insights Service - AI-powered tips and news for prediction markets
"""
import os
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

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
        
        Args:
            market_title: Title of the prediction market
            market_category: Category (Crypto, Sports, Politics, etc.)
            outcomes: List of possible outcomes (for multi-outcome markets)
            
        Returns:
            dict with analysis, tips, and sentiment
        """
        try:
            # Create chat instance with system message
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"insights_{market_title[:20]}",
                system_message="""You are a prediction market analyst providing concise, data-driven insights. 
                Focus on:
                1. Key factors affecting the outcome
                2. Recent relevant developments
                3. Probability assessment
                4. Risk factors
                Keep responses under 150 words, bullet points preferred."""
            ).with_model("openai", "gpt-4o-mini")
            
            # Build the analysis prompt
            if outcomes and len(outcomes) > 1:
                outcomes_text = ", ".join([f"{o.get('title', 'Unknown')} ({int(o.get('price', 0)*100)}%)" for o in outcomes[:5]])
                prompt = f"""Analyze this prediction market:
Market: {market_title}
Category: {market_category}
Current Probabilities: {outcomes_text}

Provide:
1. Key Analysis (2-3 points)
2. Betting Tips (1-2 points)
3. Risk Assessment"""
            else:
                prompt = f"""Analyze this prediction market:
Market: {market_title}
Category: {market_category}

Provide:
1. Key Analysis (2-3 points)
2. Betting Tips (1-2 points)
3. Risk Assessment"""
            
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
    
    def _extract_sentiment(self, text: str) -> str:
        """Extract sentiment from analysis text"""
        text_lower = text.lower()
        
        positive_words = ['bullish', 'likely', 'strong', 'favor', 'positive', 'increasing', 'high probability']
        negative_words = ['bearish', 'unlikely', 'weak', 'against', 'negative', 'decreasing', 'low probability']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "bullish"
        elif negative_count > positive_count:
            return "bearish"
        else:
            return "neutral"
