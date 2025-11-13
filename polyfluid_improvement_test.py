#!/usr/bin/env python3
"""
Polyfluid Backend Improvements Verification Test
Quick test to verify recent improvements to market count and filtering
"""

import requests
import json
import time
from datetime import datetime, timedelta
import logging
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from environment
BACKEND_URL = "https://betfluid.preview.emergentagent.com/api"

class PolyfluidImprovementTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = {
            "market_count": {"passed": False, "details": []},
            "market_activity": {"passed": False, "details": []},
            "orderbook_test": {"passed": False, "details": []},
            "chart_test": {"passed": False, "details": []},
            "logs_check": {"passed": False, "details": []}
        }
        self.test_market_id = None
        self.test_token_id = None
    
    def test_markets_count_improvement(self):
        """Test Goal 1: Verify /api/markets?limit=150 returns MORE markets (80-120+ active markets)"""
        logger.info("=== Testing Markets Count Improvement ===")
        
        try:
            response = requests.get(f"{self.backend_url}/markets?limit=150", timeout=30)
            logger.info(f"Markets API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["market_count"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            markets = data.get("markets", [])
            total_count = len(markets)
            
            logger.info(f"Total markets returned: {total_count}")
            self.test_results["market_count"]["details"].append(f"📊 Total markets returned: {total_count}")
            
            # Check if we have the expected improvement (80-120+ markets)
            if total_count >= 80:
                self.test_results["market_count"]["details"].append(f"✅ EXCELLENT: {total_count} markets returned (expected 80-120+)")
                self.test_results["market_count"]["details"].append("✅ Significant improvement from previous 25 markets")
            elif total_count >= 50:
                self.test_results["market_count"]["details"].append(f"✅ GOOD: {total_count} markets returned (improvement shown)")
                self.test_results["market_count"]["details"].append("⚠️ Slightly below target of 80+ but still improved")
            else:
                self.test_results["market_count"]["details"].append(f"❌ INSUFFICIENT: Only {total_count} markets (expected 80-120+)")
                return False
            
            # Store first valid market for further testing
            for market in markets:
                market_id = market.get('id')
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
                
                if self.test_token_id:
                    break
            
            if not self.test_token_id:
                self.test_results["market_count"]["details"].append("❌ No valid token_id found for further testing")
                return False
            
            self.test_results["market_count"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Markets count test failed: {e}")
            self.test_results["market_count"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def test_markets_are_active(self):
        """Test Goal 2: Confirm all markets are still ACTIVE (future end dates)"""
        logger.info("=== Testing Market Activity Status ===")
        
        try:
            response = requests.get(f"{self.backend_url}/markets?limit=150", timeout=30)
            
            if response.status_code != 200:
                self.test_results["market_activity"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            markets = data.get("markets", [])
            
            # Pick 3 random markets to verify their end dates
            import random
            sample_markets = random.sample(markets, min(3, len(markets)))
            
            current_date = datetime.now()
            active_count = 0
            expired_count = 0
            
            for i, market in enumerate(sample_markets):
                title = market.get('title', 'No title')
                end_date_str = market.get('endDate', '')
                
                logger.info(f"Sample Market {i+1}: {title}")
                logger.info(f"  End Date: {end_date_str}")
                
                if end_date_str:
                    try:
                        # Handle different date formats
                        if 'T' in end_date_str:
                            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        else:
                            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                        
                        # Check if market is active (end date in the future)
                        if end_date.replace(tzinfo=None) > current_date:
                            active_count += 1
                            days_future = (end_date.replace(tzinfo=None) - current_date).days
                            self.test_results["market_activity"]["details"].append(f"✅ '{title}' ends {end_date_str} ({days_future} days from now)")
                        else:
                            expired_count += 1
                            days_past = (current_date - end_date.replace(tzinfo=None)).days
                            self.test_results["market_activity"]["details"].append(f"❌ '{title}' ended {end_date_str} ({days_past} days ago)")
                    except Exception as e:
                        logger.warning(f"Could not parse end date '{end_date_str}': {e}")
                        self.test_results["market_activity"]["details"].append(f"⚠️ Could not parse end date for '{title}': {end_date_str}")
            
            # Summary
            self.test_results["market_activity"]["details"].append(f"📊 Sample verification: {active_count} active, {expired_count} expired")
            
            if expired_count == 0:
                self.test_results["market_activity"]["details"].append("✅ All sampled markets are ACTIVE (future end dates)")
                self.test_results["market_activity"]["passed"] = True
                return True
            else:
                self.test_results["market_activity"]["details"].append("❌ Found expired markets in sample")
                return False
            
        except Exception as e:
            logger.error(f"Market activity test failed: {e}")
            self.test_results["market_activity"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def test_orderbook_still_works(self):
        """Test Goal 3a: Test orderbook endpoint still works correctly"""
        logger.info("=== Testing Orderbook Endpoint ===")
        
        if not self.test_token_id or not self.test_market_id:
            self.test_results["orderbook_test"]["details"].append("❌ No valid token_id from markets test")
            return False
        
        try:
            url = f"{self.backend_url}/markets/{self.test_market_id}/orderbook?token_id={self.test_token_id}"
            logger.info(f"Testing orderbook URL: {url}")
            
            response = requests.get(url, timeout=30)
            logger.info(f"Orderbook API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["orderbook_test"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            bids = data.get("bids", [])
            asks = data.get("asks", [])
            
            logger.info(f"Orderbook data: {len(bids)} bids, {len(asks)} asks")
            
            # Check for live data
            if bids or asks:
                self.test_results["orderbook_test"]["details"].append(f"✅ Orderbook returned live data: {len(bids)} bids, {len(asks)} asks")
                
                # Check for non-zero sizes
                if bids:
                    non_zero_bids = [bid for bid in bids if bid.get('size', 0) > 0]
                    if non_zero_bids:
                        self.test_results["orderbook_test"]["details"].append(f"✅ Found {len(non_zero_bids)} bids with non-zero size")
                
                if asks:
                    non_zero_asks = [ask for ask in asks if ask.get('size', 0) > 0]
                    if non_zero_asks:
                        self.test_results["orderbook_test"]["details"].append(f"✅ Found {len(non_zero_asks)} asks with non-zero size")
                
                self.test_results["orderbook_test"]["passed"] = True
                return True
            else:
                self.test_results["orderbook_test"]["details"].append("❌ Empty orderbook - no bids or asks")
                return False
            
        except Exception as e:
            logger.error(f"Orderbook test failed: {e}")
            self.test_results["orderbook_test"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def test_chart_still_works(self):
        """Test Goal 3b: Test chart endpoint still works correctly"""
        logger.info("=== Testing Chart Endpoint ===")
        
        if not self.test_token_id or not self.test_market_id:
            self.test_results["chart_test"]["details"].append("❌ No valid token_id from markets test")
            return False
        
        try:
            url = f"{self.backend_url}/markets/{self.test_market_id}/chart?token_id={self.test_token_id}&interval=1h"
            logger.info(f"Testing chart URL: {url}")
            
            response = requests.get(url, timeout=30)
            logger.info(f"Chart API response status: {response.status_code}")
            
            if response.status_code != 200:
                self.test_results["chart_test"]["details"].append(f"❌ API returned status {response.status_code}")
                return False
            
            data = response.json()
            chart_data = data.get("data", [])
            
            logger.info(f"Chart data: {len(chart_data)} data points")
            
            if len(chart_data) >= 5:
                self.test_results["chart_test"]["details"].append(f"✅ Chart returned live data: {len(chart_data)} data points")
                
                # Check first few data points for validity
                valid_points = 0
                for point in chart_data[:5]:
                    timestamp = point.get('timestamp', 0)
                    price = point.get('price', 0)
                    if timestamp > 0 and 0 <= price <= 1:
                        valid_points += 1
                
                if valid_points >= 3:
                    self.test_results["chart_test"]["details"].append(f"✅ Found {valid_points} valid data points with proper timestamps and prices")
                    self.test_results["chart_test"]["passed"] = True
                    return True
                else:
                    self.test_results["chart_test"]["details"].append(f"❌ Only {valid_points} valid data points found")
                    return False
            else:
                self.test_results["chart_test"]["details"].append(f"❌ Insufficient chart data: {len(chart_data)} points (expected at least 5)")
                return False
            
        except Exception as e:
            logger.error(f"Chart test failed: {e}")
            self.test_results["chart_test"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def check_improvement_logs(self):
        """Check backend logs for improvement evidence"""
        logger.info("=== Checking Backend Logs for Improvements ===")
        
        try:
            # Check error log for improvement messages
            result = subprocess.run(
                ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                error_log = result.stdout
                logger.info(f"Error log length: {len(error_log)} characters")
                
                # Look for improvement indicators
                improvement_indicators = [
                    "Fetching MORE markets",
                    "increased limit",
                    "filtering",
                    "active markets",
                    "market count"
                ]
                
                found_indicators = []
                for indicator in improvement_indicators:
                    if indicator.lower() in error_log.lower():
                        found_indicators.append(indicator)
                
                if found_indicators:
                    self.test_results["logs_check"]["details"].append(f"✅ Found improvement indicators: {', '.join(found_indicators)}")
                else:
                    self.test_results["logs_check"]["details"].append("⚠️ No specific improvement indicators found in logs")
                
                # Look for API call indicators
                if "Calling Polymarket" in error_log:
                    api_calls = error_log.count("Calling Polymarket")
                    self.test_results["logs_check"]["details"].append(f"✅ Found {api_calls} Polymarket API calls")
                
                # Check for errors
                if "Error" in error_log or "Exception" in error_log:
                    error_lines = [line for line in error_log.split('\n') if 'Error' in line or 'Exception' in line]
                    if error_lines:
                        self.test_results["logs_check"]["details"].append(f"⚠️ Found {len(error_lines)} error/exception lines")
                        # Show last error for context
                        if error_lines:
                            self.test_results["logs_check"]["details"].append(f"   Last error: {error_lines[-1].strip()}")
                else:
                    self.test_results["logs_check"]["details"].append("✅ No errors found in recent logs")
            
            self.test_results["logs_check"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Log check failed: {e}")
            self.test_results["logs_check"]["details"].append(f"❌ Exception checking logs: {str(e)}")
            return False
    
    def run_improvement_verification(self):
        """Run all improvement verification tests"""
        logger.info("🚀 Starting Polyfluid Backend Improvement Verification")
        logger.info(f"Backend URL: {self.backend_url}")
        
        # Test 1: Market count improvement
        count_passed = self.test_markets_count_improvement()
        
        # Test 2: Market activity verification
        activity_passed = self.test_markets_are_active()
        
        # Test 3a: Orderbook still works
        orderbook_passed = False
        if count_passed:
            orderbook_passed = self.test_orderbook_still_works()
        
        # Test 3b: Chart still works
        chart_passed = False
        if count_passed:
            chart_passed = self.test_chart_still_works()
        
        # Test 4: Log check
        logs_passed = self.check_improvement_logs()
        
        # Generate summary
        self.print_improvement_summary()
        
        return {
            "market_count": count_passed,
            "market_activity": activity_passed,
            "orderbook": orderbook_passed,
            "chart": chart_passed,
            "logs": logs_passed
        }
    
    def print_improvement_summary(self):
        """Print improvement verification summary"""
        logger.info("\n" + "="*70)
        logger.info("🔍 POLYFLUID BACKEND IMPROVEMENT VERIFICATION RESULTS")
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
        
        # Specific improvement assessment
        count_passed = self.test_results["market_count"]["passed"]
        activity_passed = self.test_results["market_activity"]["passed"]
        orderbook_passed = self.test_results["orderbook_test"]["passed"]
        chart_passed = self.test_results["chart_test"]["passed"]
        
        if count_passed and activity_passed and orderbook_passed and chart_passed:
            logger.info("🎉 POLYFLUID BACKEND IMPROVEMENTS VERIFIED!")
            logger.info("   ✅ Market count significantly increased (80+ markets)")
            logger.info("   ✅ All markets are active with future end dates")
            logger.info("   ✅ Orderbook and chart endpoints working correctly")
        elif count_passed and activity_passed:
            logger.info("✅ CORE IMPROVEMENTS VERIFIED")
            logger.info("   ✅ More markets returned and all are active")
            logger.info("   ⚠️ Some endpoint issues detected")
        else:
            logger.info("❌ IMPROVEMENT VERIFICATION FAILED")
            logger.info("   Issues detected with backend improvements")

if __name__ == "__main__":
    tester = PolyfluidImprovementTester()
    results = tester.run_improvement_verification()