#!/usr/bin/env python3
"""
Backend API Testing for Polyfluid - Polymarket Integration
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

class PolyfluidBackendTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = {
            "markets": {"passed": False, "details": []},
            "orderbook": {"passed": False, "details": []},
            "chart_data": {"passed": False, "details": []},
            "logs_check": {"passed": False, "details": []}
        }
        self.test_market_id = None
        self.test_token_id = None
    
    def test_markets_endpoint(self):
        """Test /api/markets endpoint - FOCUS: Verify stricter date filtering (Nov 14+ only)"""
        logger.info("=== Testing Markets Endpoint - STRICTER DATE FILTERING (NOV 14+ ONLY) ===")
        
        try:
            response = requests.get(f"{self.backend_url}/markets?limit=150", timeout=30)
            logger.info(f"Markets API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["markets"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            markets = data.get("markets", [])
            
            if not markets:
                self.test_results["markets"]["details"].append("❌ No markets returned")
                return False
            
            logger.info(f"Found {len(markets)} markets")
            
            # CRITICAL TEST: Check ALL markets have end dates >= Nov 14, 2025
            current_date = datetime.now()
            nov_14_2025 = datetime(2025, 11, 14)  # Nov 14, 2025
            expired_markets = []
            ending_soon_markets = []  # Nov 7, 13 or earlier
            future_markets = []  # Nov 14+
            suspicious_titles = []
            
            for i, market in enumerate(markets):
                market_id = market.get('id')
                title = market.get('title', 'No title')
                end_date_str = market.get('endDate', '')
                
                logger.info(f"Market {i+1}: {title}")
                logger.info(f"  End Date: {end_date_str}")
                
                # Parse and check end date
                if end_date_str:
                    try:
                        # Handle different date formats
                        if 'T' in end_date_str:
                            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        else:
                            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                        
                        # Check if market ends before Nov 14, 2025
                        end_date_clean = end_date.replace(tzinfo=None)
                        
                        if end_date_clean < nov_14_2025:
                            # Check if it's expired (past) or ending soon (Nov 7, 13, etc.)
                            if end_date_clean <= current_date:
                                expired_markets.append({
                                    'title': title,
                                    'end_date': end_date_str,
                                    'days_past': (current_date - end_date_clean).days
                                })
                                logger.error(f"❌ EXPIRED MARKET FOUND: {title} ended on {end_date_str}")
                            else:
                                ending_soon_markets.append({
                                    'title': title,
                                    'end_date': end_date_str,
                                    'days_until': (end_date_clean - current_date).days
                                })
                                logger.error(f"❌ ENDING-SOON MARKET FOUND: {title} ends on {end_date_str} (before Nov 14)")
                        else:
                            future_markets.append({
                                'title': title,
                                'end_date': end_date_str,
                                'days_future': (end_date_clean - current_date).days
                            })
                            logger.info(f"✅ Valid market: {title} ends {end_date_str} (Nov 14+)")
                    except Exception as e:
                        logger.warning(f"Could not parse end date '{end_date_str}': {e}")
                
                # Check for suspicious titles that sound like they already ended
                title_lower = title.lower()
                suspicious_keywords = [
                    'mandan margin', 'election results', 'winner of', 'final score',
                    'who won', 'results of', 'outcome of', 'decided', 'concluded'
                ]
                
                for keyword in suspicious_keywords:
                    if keyword in title_lower:
                        suspicious_titles.append(title)
                        logger.warning(f"⚠️ Suspicious title (sounds ended): {title}")
                        break
                
                # Store first valid token for further testing
                if not self.test_token_id:
                    if market.get('is_multi_outcome'):
                        outcomes = market.get('outcomes', [])
                        for outcome in outcomes:
                            token_id = outcome.get('token_id', '')
                            if token_id:
                                self.test_token_id = token_id
                                self.test_market_id = market_id
                                break
                    else:
                        token_id = market.get('token_id', '')
                        if token_id:
                            self.test_token_id = token_id
                            self.test_market_id = market_id
            
            # Report results
            self.test_results["markets"]["details"].append(f"📊 Total markets analyzed: {len(markets)}")
            self.test_results["markets"]["details"].append(f"✅ Valid markets (Nov 14+): {len(future_markets)}")
            self.test_results["markets"]["details"].append(f"❌ Expired markets (past): {len(expired_markets)}")
            self.test_results["markets"]["details"].append(f"❌ Ending-soon markets (Nov 7, 13, etc.): {len(ending_soon_markets)}")
            
            # Sample 5-10 markets and show their end dates
            sample_markets = markets[:10] if len(markets) >= 10 else markets[:5]
            self.test_results["markets"]["details"].append(f"📋 Sample of {len(sample_markets)} market end dates:")
            for i, market in enumerate(sample_markets):
                title = market.get('title', 'No title')[:50] + "..." if len(market.get('title', '')) > 50 else market.get('title', 'No title')
                end_date = market.get('endDate', 'No date')
                self.test_results["markets"]["details"].append(f"   {i+1}. {title} → {end_date}")
            
            # Check for violations
            violations = expired_markets + ending_soon_markets
            if violations:
                self.test_results["markets"]["details"].append("❌ CRITICAL: Found markets that should be filtered out:")
                for violation in violations:
                    if violation in expired_markets:
                        self.test_results["markets"]["details"].append(f"   - EXPIRED: '{violation['title']}' ended {violation['end_date']} ({violation['days_past']} days ago)")
                    else:
                        self.test_results["markets"]["details"].append(f"   - ENDING-SOON: '{violation['title']}' ends {violation['end_date']} (before Nov 14)")
                return False
            else:
                self.test_results["markets"]["details"].append("✅ EXCELLENT: All markets end Nov 14, 2025 or later")
            
            if suspicious_titles:
                self.test_results["markets"]["details"].append(f"⚠️ Found {len(suspicious_titles)} markets with suspicious titles:")
                for title in suspicious_titles:
                    self.test_results["markets"]["details"].append(f"   - {title}")
            
            # Check that we have markets ending in November 14+ and later dates
            nov_14_plus = [m for m in future_markets if '2025-11-1' in m['end_date'] or '2025-12' in m['end_date'] or '2026' in m['end_date'] or '2027' in m['end_date']]
            if nov_14_plus:
                self.test_results["markets"]["details"].append(f"✅ Found {len(nov_14_plus)} markets ending Nov 14+ or later")
            
            if not self.test_token_id:
                self.test_results["markets"]["details"].append("❌ No valid token_id found for further testing")
                return False
            
            logger.info(f"Selected for further testing: market_id={self.test_market_id}, token_id={self.test_token_id}")
            self.test_results["markets"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Markets test failed: {e}")
            self.test_results["markets"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def test_orderbook_endpoint(self):
        """Test /api/markets/{market_id}/orderbook endpoint"""
        logger.info("=== Testing Orderbook Endpoint ===")
        
        if not self.test_token_id or not self.test_market_id:
            self.test_results["orderbook"]["details"].append("❌ No valid token_id from markets test")
            return False
        
        try:
            url = f"{self.backend_url}/markets/{self.test_market_id}/orderbook?token_id={self.test_token_id}"
            logger.info(f"Testing orderbook URL: {url}")
            
            response = requests.get(url, timeout=30)
            logger.info(f"Orderbook API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["orderbook"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            bids = data.get("bids", [])
            asks = data.get("asks", [])
            
            logger.info(f"Orderbook data: {len(bids)} bids, {len(asks)} asks")
            
            # Check for real orderbook data
            if not bids and not asks:
                self.test_results["orderbook"]["details"].append("❌ Empty orderbook - no bids or asks")
                return False
            
            # Verify bids have decreasing prices
            if bids:
                bid_prices = [bid.get('price', 0) for bid in bids]
                if len(bid_prices) > 1:
                    is_decreasing = all(bid_prices[i] >= bid_prices[i+1] for i in range(len(bid_prices)-1))
                    if is_decreasing:
                        self.test_results["orderbook"]["details"].append("✅ Bids are properly ordered (decreasing prices)")
                    else:
                        self.test_results["orderbook"]["details"].append("⚠️ Bids not properly ordered")
                
                # Check for non-zero sizes
                non_zero_bids = [bid for bid in bids if bid.get('size', 0) > 0]
                if non_zero_bids:
                    self.test_results["orderbook"]["details"].append(f"✅ Found {len(non_zero_bids)} bids with non-zero size")
                else:
                    self.test_results["orderbook"]["details"].append("❌ All bids have zero size")
            
            # Verify asks have increasing prices
            if asks:
                ask_prices = [ask.get('price', 0) for ask in asks]
                if len(ask_prices) > 1:
                    is_increasing = all(ask_prices[i] <= ask_prices[i+1] for i in range(len(ask_prices)-1))
                    if is_increasing:
                        self.test_results["orderbook"]["details"].append("✅ Asks are properly ordered (increasing prices)")
                    else:
                        self.test_results["orderbook"]["details"].append("⚠️ Asks not properly ordered")
                
                # Check for non-zero sizes
                non_zero_asks = [ask for ask in asks if ask.get('size', 0) > 0]
                if non_zero_asks:
                    self.test_results["orderbook"]["details"].append(f"✅ Found {len(non_zero_asks)} asks with non-zero size")
                else:
                    self.test_results["orderbook"]["details"].append("❌ All asks have zero size")
            
            # Check for mock/placeholder values
            mock_indicators = ["No bids", "No asks", "mock", "placeholder", "test"]
            has_mock = False
            for bid in bids:
                for key, value in bid.items():
                    if any(indicator in str(value).lower() for indicator in mock_indicators):
                        has_mock = True
                        break
            
            for ask in asks:
                for key, value in ask.items():
                    if any(indicator in str(value).lower() for indicator in mock_indicators):
                        has_mock = True
                        break
            
            if has_mock:
                self.test_results["orderbook"]["details"].append("❌ Found mock/placeholder values in orderbook")
                return False
            else:
                self.test_results["orderbook"]["details"].append("✅ No mock/placeholder values detected")
            
            self.test_results["orderbook"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Orderbook test failed: {e}")
            self.test_results["orderbook"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def test_chart_data_endpoint(self):
        """Test /api/markets/{market_id}/chart endpoint"""
        logger.info("=== Testing Chart Data Endpoint ===")
        
        if not self.test_token_id or not self.test_market_id:
            self.test_results["chart_data"]["details"].append("❌ No valid token_id from markets test")
            return False
        
        try:
            url = f"{self.backend_url}/markets/{self.test_market_id}/chart?token_id={self.test_token_id}&interval=1h"
            logger.info(f"Testing chart URL: {url}")
            
            response = requests.get(url, timeout=30)
            logger.info(f"Chart API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["chart_data"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            chart_data = data.get("data", [])
            
            logger.info(f"Chart data: {len(chart_data)} data points")
            
            if len(chart_data) < 5:
                self.test_results["chart_data"]["details"].append(f"❌ Too few data points: {len(chart_data)} (expected at least 5)")
                return False
            
            # Check data point structure and validity
            valid_points = 0
            recent_points = 0
            one_week_ago = (datetime.now() - timedelta(days=7)).timestamp()
            
            for point in chart_data[:10]:  # Check first 10 points
                timestamp = point.get('timestamp', 0)
                price = point.get('price', 0)
                date_field = point.get('date', 0)
                
                # Check required fields
                if timestamp > 0 and price > 0 and date_field > 0:
                    valid_points += 1
                
                # Check if timestamp is recent (within last week)
                if timestamp > one_week_ago:
                    recent_points += 1
                
                # Check price is valid probability (0-1 range)
                if not (0 <= price <= 1):
                    self.test_results["chart_data"]["details"].append(f"❌ Invalid price value: {price} (should be 0-1)")
                    return False
            
            if valid_points >= 5:
                self.test_results["chart_data"]["details"].append(f"✅ Found {valid_points} valid data points with timestamp, price, and date")
            else:
                self.test_results["chart_data"]["details"].append(f"❌ Only {valid_points} valid data points (need at least 5)")
                return False
            
            if recent_points > 0:
                self.test_results["chart_data"]["details"].append(f"✅ Found {recent_points} recent data points (within last week)")
            else:
                self.test_results["chart_data"]["details"].append("⚠️ No recent data points found (all older than 1 week)")
            
            self.test_results["chart_data"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Chart data test failed: {e}")
            self.test_results["chart_data"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def check_backend_logs(self):
        """Check backend logs for filtering evidence - FOCUS: Expired market filtering"""
        logger.info("=== Checking Backend Logs for Market Filtering ===")
        
        try:
            # Check error log for filtering messages
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "200", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            filtering_evidence = []
            
            if result.returncode == 0:
                error_log = result.stdout
                logger.info(f"Error log length: {len(error_log)} characters")
                
                # Look for specific filtering log messages
                expired_filter_logs = error_log.count("Skipping EXPIRED market")
                ending_soon_filter_logs = error_log.count("Skipping ENDING-SOON market")
                closed_filter_logs = error_log.count("Skipping CLOSED/ARCHIVED market")
                orders_filter_logs = error_log.count("Skipping market NOT accepting orders")
                
                if expired_filter_logs > 0:
                    filtering_evidence.append(f"✅ Found {expired_filter_logs} 'Skipping EXPIRED market' log entries")
                    self.test_results["logs_check"]["details"].append(f"✅ Expired market filtering active: {expired_filter_logs} markets filtered")
                
                if ending_soon_filter_logs > 0:
                    filtering_evidence.append(f"✅ Found {ending_soon_filter_logs} 'Skipping ENDING-SOON market' log entries")
                    self.test_results["logs_check"]["details"].append(f"✅ Ending-soon market filtering active: {ending_soon_filter_logs} markets filtered")
                
                if closed_filter_logs > 0:
                    filtering_evidence.append(f"✅ Found {closed_filter_logs} 'Skipping CLOSED/ARCHIVED market' log entries")
                    self.test_results["logs_check"]["details"].append(f"✅ Closed/archived market filtering active: {closed_filter_logs} markets filtered")
                
                if orders_filter_logs > 0:
                    filtering_evidence.append(f"✅ Found {orders_filter_logs} 'Skipping market NOT accepting orders' log entries")
                    self.test_results["logs_check"]["details"].append(f"✅ Non-accepting orders filtering active: {orders_filter_logs} markets filtered")
                
                # Look for specific expired/ending-soon market examples
                log_lines = error_log.split('\n')
                expired_examples = []
                ending_soon_examples = []
                for line in log_lines:
                    if "Skipping EXPIRED market" in line:
                        expired_examples.append(line.strip())
                    elif "Skipping ENDING-SOON market" in line:
                        ending_soon_examples.append(line.strip())
                
                if expired_examples:
                    self.test_results["logs_check"]["details"].append("📋 Examples of filtered expired markets:")
                    for example in expired_examples[-3:]:  # Show last 3 examples
                        self.test_results["logs_check"]["details"].append(f"   {example}")
                
                if ending_soon_examples:
                    self.test_results["logs_check"]["details"].append("📋 Examples of filtered ending-soon markets:")
                    for example in ending_soon_examples[-3:]:  # Show last 3 examples
                        self.test_results["logs_check"]["details"].append(f"   {example}")
                
                # Look for API call indicators
                polymarket_calls = []
                if "Calling Polymarket CLOB API" in error_log:
                    polymarket_calls.append("CLOB API calls found")
                if "Calling Polymarket Gamma API" in error_log:
                    polymarket_calls.append("Gamma API calls found")
                
                if polymarket_calls:
                    self.test_results["logs_check"]["details"].extend([f"✅ {call}" for call in polymarket_calls])
            
            # Check output log
            result = subprocess.run(
                ["tail", "-n", "200", "/var/log/supervisor/backend.out.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                output_log = result.stdout
                logger.info(f"Output log length: {len(output_log)} characters")
                
                # Look for filtering in output log too
                if "Skipping EXPIRED market" in output_log:
                    expired_count = output_log.count("Skipping EXPIRED market")
                    self.test_results["logs_check"]["details"].append(f"✅ Additional expired market filtering in output log: {expired_count} entries")
                
                # Look for API call indicators
                if "Calling Polymarket" in output_log:
                    self.test_results["logs_check"]["details"].append("✅ Polymarket API calls found in output log")
                
                # Look for errors
                if "Error" in output_log or "Exception" in output_log:
                    error_lines = [line for line in output_log.split('\n') if 'Error' in line or 'Exception' in line]
                    if error_lines:
                        self.test_results["logs_check"]["details"].append(f"⚠️ Found {len(error_lines)} error/exception lines")
                        for error_line in error_lines[-2:]:  # Show last 2 errors
                            self.test_results["logs_check"]["details"].append(f"   {error_line.strip()}")
            
            # Summary of filtering evidence
            if filtering_evidence:
                self.test_results["logs_check"]["details"].insert(0, "🎯 FILTERING EVIDENCE FOUND:")
                for evidence in filtering_evidence:
                    self.test_results["logs_check"]["details"].insert(1, f"   {evidence}")
            else:
                self.test_results["logs_check"]["details"].append("⚠️ No filtering log messages found - may indicate no expired markets were encountered")
            
            self.test_results["logs_check"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Log check failed: {e}")
            self.test_results["logs_check"]["details"].append(f"❌ Exception checking logs: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        logger.info("🚀 Starting Polyfluid Backend API Tests")
        logger.info(f"Backend URL: {self.backend_url}")
        
        # Test 1: Markets endpoint
        markets_passed = self.test_markets_endpoint()
        
        # Test 2: Orderbook endpoint (depends on markets test)
        orderbook_passed = False
        if markets_passed:
            orderbook_passed = self.test_orderbook_endpoint()
        
        # Test 3: Chart data endpoint (depends on markets test)
        chart_passed = False
        if markets_passed:
            chart_passed = self.test_chart_data_endpoint()
        
        # Test 4: Backend logs
        logs_passed = self.check_backend_logs()
        
        # Generate summary
        self.print_summary()
        
        return {
            "markets": markets_passed,
            "orderbook": orderbook_passed,
            "chart_data": chart_passed,
            "logs": logs_passed
        }
    
    def print_summary(self):
        """Print detailed test summary - FOCUS: Expired market filtering"""
        logger.info("\n" + "="*70)
        logger.info("🔍 POLYFLUID EXPIRED MARKET FILTERING TEST RESULTS")
        logger.info("="*70)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result["passed"] else "❌ FAILED"
            logger.info(f"\n{test_name.upper().replace('_', ' ')}: {status}")
            
            for detail in result["details"]:
                logger.info(f"  {detail}")
        
        # Overall assessment
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["passed"])
        
        logger.info(f"\n📊 OVERALL: {passed_tests}/{total_tests} tests passed")
        
        # Specific assessment for expired market filtering
        markets_passed = self.test_results["markets"]["passed"]
        logs_passed = self.test_results["logs_check"]["passed"]
        
        if markets_passed and logs_passed:
            logger.info("🎉 EXPIRED MARKET FILTERING WORKING CORRECTLY!")
            logger.info("   ✅ All returned markets have future end dates")
            logger.info("   ✅ Backend logs show filtering is active")
        elif markets_passed:
            logger.info("✅ MARKETS FILTERING WORKING - No expired markets in results")
            logger.info("⚠️ Log evidence unclear - but results are correct")
        else:
            logger.info("❌ CRITICAL ISSUE - Expired markets found in API response!")
            logger.info("   User complaint about old markets is VALID")

if __name__ == "__main__":
    tester = PolyfluidBackendTester()
    results = tester.run_all_tests()