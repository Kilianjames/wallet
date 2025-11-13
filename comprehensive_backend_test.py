#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Polyfluid - Polymarket Integration
Tests all backend endpoints to verify LIVE data from Polymarket APIs
"""

import requests
import json
import time
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from environment
BACKEND_URL = "https://betfluid.preview.emergentagent.com/api"

def test_comprehensive_backend():
    """Run comprehensive backend tests"""
    logger.info("🚀 Starting COMPREHENSIVE Polyfluid Backend API Tests")
    logger.info(f"Backend URL: {BACKEND_URL}")
    
    results = {
        "markets_live_data": False,
        "orderbook_live_data": False,
        "chart_data_available": False,
        "api_calls_logged": False,
        "no_mock_values": False
    }
    
    # Test 1: Markets endpoint with detailed analysis
    logger.info("\n=== 1. TESTING MARKETS ENDPOINT ===")
    try:
        response = requests.get(f"{BACKEND_URL}/markets?limit=10", timeout=30)
        if response.status_code == 200:
            data = response.json()
            markets = data.get("markets", [])
            
            logger.info(f"✅ Markets API working - {len(markets)} markets returned")
            
            # Analyze market data for live indicators
            live_volume_count = 0
            live_liquidity_count = 0
            valid_prices_count = 0
            valid_tokens_count = 0
            
            test_tokens = []
            
            for market in markets:
                volume = market.get('volume', 0)
                liquidity = market.get('liquidity', 0)
                
                if volume > 0:
                    live_volume_count += 1
                if liquidity > 0:
                    live_liquidity_count += 1
                
                # Check prices and collect tokens
                if market.get('is_multi_outcome'):
                    for outcome in market.get('outcomes', []):
                        price = outcome.get('price', 0)
                        token_id = outcome.get('token_id', '')
                        if 0 < price < 1:
                            valid_prices_count += 1
                        if token_id:
                            valid_tokens_count += 1
                            test_tokens.append({
                                'token_id': token_id,
                                'market_id': market.get('id'),
                                'title': market.get('title', '')[:30]
                            })
                else:
                    yes_price = market.get('yesPrice', 0)
                    token_id = market.get('token_id', '')
                    if 0 < yes_price < 1:
                        valid_prices_count += 1
                    if token_id:
                        valid_tokens_count += 1
                        test_tokens.append({
                            'token_id': token_id,
                            'market_id': market.get('id'),
                            'title': market.get('title', '')[:30]
                        })
            
            logger.info(f"  📊 Live volume in {live_volume_count}/{len(markets)} markets")
            logger.info(f"  📊 Live liquidity in {live_liquidity_count}/{len(markets)} markets")
            logger.info(f"  📊 Valid prices: {valid_prices_count}")
            logger.info(f"  📊 Valid tokens: {valid_tokens_count}")
            
            if live_volume_count > 0 and live_liquidity_count > 0 and valid_prices_count > 0:
                results["markets_live_data"] = True
                logger.info("  ✅ MARKETS: Live data confirmed")
            else:
                logger.info("  ❌ MARKETS: No clear live data indicators")
        else:
            logger.info(f"  ❌ MARKETS: API returned status {response.status_code}")
    except Exception as e:
        logger.info(f"  ❌ MARKETS: Exception - {e}")
    
    # Test 2: Orderbook endpoint with multiple tokens
    logger.info("\n=== 2. TESTING ORDERBOOK ENDPOINT ===")
    orderbook_success = False
    
    for i, token_info in enumerate(test_tokens[:3]):  # Test first 3 tokens
        try:
            token_id = token_info['token_id']
            market_id = token_info['market_id']
            title = token_info['title']
            
            logger.info(f"  Testing token {i+1}: {title}...")
            
            url = f"{BACKEND_URL}/markets/{market_id}/orderbook?token_id={token_id}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                bids = data.get("bids", [])
                asks = data.get("asks", [])
                
                logger.info(f"    📊 {len(bids)} bids, {len(asks)} asks")
                
                # Check for real data
                if bids or asks:
                    # Check for non-zero sizes
                    valid_bids = [b for b in bids if b.get('size', 0) > 0]
                    valid_asks = [a for a in asks if a.get('size', 0) > 0]
                    
                    if valid_bids or valid_asks:
                        logger.info(f"    ✅ Live orderbook data found")
                        orderbook_success = True
                        break
                    else:
                        logger.info(f"    ⚠️ Orderbook exists but all sizes are zero")
                else:
                    logger.info(f"    ⚠️ Empty orderbook")
            else:
                logger.info(f"    ⚠️ Status {response.status_code}")
        except Exception as e:
            logger.info(f"    ❌ Exception: {e}")
    
    if orderbook_success:
        results["orderbook_live_data"] = True
        logger.info("  ✅ ORDERBOOK: Live data confirmed")
    else:
        logger.info("  ❌ ORDERBOOK: No live data found")
    
    # Test 3: Chart data with multiple intervals
    logger.info("\n=== 3. TESTING CHART DATA ENDPOINT ===")
    chart_success = False
    
    for i, token_info in enumerate(test_tokens[:2]):  # Test first 2 tokens
        token_id = token_info['token_id']
        market_id = token_info['market_id']
        title = token_info['title']
        
        logger.info(f"  Testing token {i+1}: {title}...")
        
        # Test different intervals
        for interval in ['1d', '1h', '4h']:
            try:
                url = f"{BACKEND_URL}/markets/{market_id}/chart?token_id={token_id}&interval={interval}"
                response = requests.get(url, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    chart_data = data.get("data", [])
                    
                    logger.info(f"    📊 {interval}: {len(chart_data)} data points")
                    
                    if len(chart_data) >= 5:  # Good amount of data
                        # Check data validity
                        valid_points = 0
                        for point in chart_data[:5]:
                            if (point.get('timestamp', 0) > 0 and 
                                0 <= point.get('price', -1) <= 1 and 
                                point.get('date', 0) > 0):
                                valid_points += 1
                        
                        if valid_points >= 3:
                            logger.info(f"    ✅ {interval}: Valid historical data found")
                            chart_success = True
                            break
                    elif len(chart_data) > 0:
                        logger.info(f"    ⚠️ {interval}: Limited data ({len(chart_data)} points)")
                else:
                    logger.info(f"    ⚠️ {interval}: Status {response.status_code}")
            except Exception as e:
                logger.info(f"    ❌ {interval}: Exception - {e}")
        
        if chart_success:
            break
    
    if chart_success:
        results["chart_data_available"] = True
        logger.info("  ✅ CHART DATA: Historical data confirmed")
    else:
        logger.info("  ❌ CHART DATA: No sufficient historical data")
    
    # Test 4: Check backend logs for API calls
    logger.info("\n=== 4. CHECKING BACKEND LOGS ===")
    try:
        import subprocess
        
        # Check for Polymarket API calls in logs
        result = subprocess.run(
            ["tail", "-n", "200", "/var/log/supervisor/backend.err.log"],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode == 0:
            log_content = result.stdout
            
            clob_calls = log_content.count("Calling Polymarket CLOB API")
            gamma_calls = log_content.count("Calling Polymarket Gamma API")
            api_responses = log_content.count("API response status: 200")
            
            logger.info(f"  📊 CLOB API calls: {clob_calls}")
            logger.info(f"  📊 Gamma API calls: {gamma_calls}")
            logger.info(f"  📊 Successful API responses: {api_responses}")
            
            if clob_calls > 0 or api_responses > 0:
                results["api_calls_logged"] = True
                logger.info("  ✅ LOGS: Polymarket API calls confirmed")
            else:
                logger.info("  ⚠️ LOGS: No clear API call evidence")
        else:
            logger.info("  ⚠️ LOGS: Could not read log file")
    except Exception as e:
        logger.info(f"  ❌ LOGS: Exception - {e}")
    
    # Test 5: Check for mock values
    logger.info("\n=== 5. CHECKING FOR MOCK VALUES ===")
    mock_found = False
    
    try:
        # Re-test markets for mock indicators
        response = requests.get(f"{BACKEND_URL}/markets?limit=5", timeout=30)
        if response.status_code == 200:
            data = response.json()
            markets_str = json.dumps(data)
            
            mock_indicators = ["mock", "test", "placeholder", "dummy", "fake", "example"]
            found_mocks = []
            
            for indicator in mock_indicators:
                if indicator.lower() in markets_str.lower():
                    found_mocks.append(indicator)
                    mock_found = True
            
            if found_mocks:
                logger.info(f"  ⚠️ Found potential mock indicators: {found_mocks}")
            else:
                logger.info("  ✅ No obvious mock values detected")
                results["no_mock_values"] = True
        else:
            logger.info("  ⚠️ Could not check for mock values")
    except Exception as e:
        logger.info(f"  ❌ Mock check failed: {e}")
    
    # Final Assessment
    logger.info("\n" + "="*60)
    logger.info("🔍 COMPREHENSIVE TEST RESULTS")
    logger.info("="*60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{test_name.replace('_', ' ').title()}: {status}")
    
    logger.info(f"\n📊 OVERALL SCORE: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests >= 4:
        logger.info("🎉 EXCELLENT - Live Polymarket integration confirmed!")
        return "EXCELLENT"
    elif passed_tests >= 3:
        logger.info("✅ GOOD - Mostly working with minor issues")
        return "GOOD"
    elif passed_tests >= 2:
        logger.info("⚠️ PARTIAL - Some functionality working")
        return "PARTIAL"
    else:
        logger.info("❌ POOR - Significant issues detected")
        return "POOR"

if __name__ == "__main__":
    result = test_comprehensive_backend()
    print(f"\nFinal Assessment: {result}")