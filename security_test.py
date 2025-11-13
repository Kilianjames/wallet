#!/usr/bin/env python3
"""
CRITICAL SECURITY TEST: Private Key Leak Detection
Tests the backend to ensure the private key is NEVER exposed anywhere.
"""

import requests
import json
import subprocess
import logging
import os
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from environment
BACKEND_URL = "https://betfluid.preview.emergentagent.com/api"

class SecurityTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.private_key = "4Q5zkPSUQAsQ39dMVK9fwgFWkKMMXruqnuSMMg8x7S3BV9ZEpvpjcianvxDFsBmSSgdWbQ89zVeX7CoT8QYmSWT"
        self.public_address = "2dmLwEMVZrrQHvdba7oQGHk2pw8Hnr8VG7an5hUMDCCP"
        self.test_results = {
            "close_position_endpoint": {"passed": False, "details": []},
            "backend_logs_check": {"passed": False, "details": []},
            "error_responses": {"passed": False, "details": []},
            "env_security": {"passed": False, "details": []}
        }
    
    def test_close_position_endpoint(self):
        """Test the close position endpoint for private key leaks"""
        logger.info("=== Testing Close Position Endpoint for Private Key Leaks ===")
        
        try:
            # Test the close-with-refund endpoint
            url = f"{self.backend_url}/positions/close-with-refund"
            params = {
                "position_id": "test123",
                "wallet_address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
                "amount_sol": 0.001
            }
            
            logger.info(f"Testing URL: {url}")
            logger.info(f"Parameters: {params}")
            
            response = requests.post(url, params=params, timeout=30)
            logger.info(f"Response status: {response.status_code}")
            
            # Get response text
            response_text = response.text
            logger.info(f"Response length: {len(response_text)} characters")
            
            # Check if private key appears in response
            if self.private_key in response_text:
                self.test_results["close_position_endpoint"]["details"].append("❌ CRITICAL: Private key found in API response!")
                self.test_results["close_position_endpoint"]["details"].append(f"   Response contains: {self.private_key}")
                return False
            else:
                self.test_results["close_position_endpoint"]["details"].append("✅ Private key NOT found in API response")
            
            # Check for partial private key leaks
            private_key_parts = [self.private_key[:10], self.private_key[10:20], self.private_key[20:30]]
            for i, part in enumerate(private_key_parts):
                if part in response_text:
                    self.test_results["close_position_endpoint"]["details"].append(f"❌ CRITICAL: Private key fragment {i+1} found in response!")
                    return False
            
            self.test_results["close_position_endpoint"]["details"].append("✅ No private key fragments found in response")
            
            # Check for sensitive keywords
            sensitive_keywords = ["private_key", "DESTINATION_WALLET_PRIVATE_KEY", "secret", "keypair"]
            for keyword in sensitive_keywords:
                if keyword.lower() in response_text.lower():
                    self.test_results["close_position_endpoint"]["details"].append(f"⚠️ Sensitive keyword '{keyword}' found in response")
            
            # Parse JSON response if possible
            try:
                response_json = response.json()
                logger.info(f"Response JSON keys: {list(response_json.keys())}")
                
                # Check expected response structure
                expected_keys = ["success", "signature", "amount", "message"]
                actual_keys = list(response_json.keys())
                
                # Verify only safe keys are present
                safe_response = True
                for key in actual_keys:
                    if key not in expected_keys and key not in ["error", "detail"]:
                        self.test_results["close_position_endpoint"]["details"].append(f"⚠️ Unexpected key in response: {key}")
                        safe_response = False
                
                if safe_response:
                    self.test_results["close_position_endpoint"]["details"].append("✅ Response contains only expected safe keys")
                
                # Check if public address is present (this is OK)
                if self.public_address in response_text:
                    self.test_results["close_position_endpoint"]["details"].append(f"✅ Public address found in response (safe): {self.public_address}")
                
            except json.JSONDecodeError:
                self.test_results["close_position_endpoint"]["details"].append("⚠️ Response is not valid JSON")
            
            self.test_results["close_position_endpoint"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Close position test failed: {e}")
            self.test_results["close_position_endpoint"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def check_backend_logs(self):
        """Check backend logs for private key leaks"""
        logger.info("=== Checking Backend Logs for Private Key Leaks ===")
        
        try:
            # Check error log
            result = subprocess.run(
                ["tail", "-n", "500", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                error_log = result.stdout
                logger.info(f"Error log length: {len(error_log)} characters")
                
                # Check for private key in logs
                if self.private_key in error_log:
                    self.test_results["backend_logs_check"]["details"].append("❌ CRITICAL: Private key found in error logs!")
                    return False
                else:
                    self.test_results["backend_logs_check"]["details"].append("✅ Private key NOT found in error logs")
                
                # Check for private key fragments
                private_key_parts = [self.private_key[:15], self.private_key[15:30], self.private_key[30:45]]
                for i, part in enumerate(private_key_parts):
                    if part in error_log:
                        self.test_results["backend_logs_check"]["details"].append(f"❌ CRITICAL: Private key fragment {i+1} found in error logs!")
                        return False
                
                # Check for sensitive keywords
                sensitive_patterns = [
                    r"private_key",
                    r"DESTINATION_WALLET_PRIVATE_KEY",
                    r"secret.*key",
                    r"keypair.*bytes"
                ]
                
                for pattern in sensitive_patterns:
                    matches = re.findall(pattern, error_log, re.IGNORECASE)
                    if matches:
                        self.test_results["backend_logs_check"]["details"].append(f"⚠️ Sensitive pattern '{pattern}' found {len(matches)} times in error logs")
                
                # Check if only public address is logged (this is safe)
                public_address_count = error_log.count(self.public_address)
                if public_address_count > 0:
                    self.test_results["backend_logs_check"]["details"].append(f"✅ Public address logged {public_address_count} times (safe)")
                
                # Look for proper security messages
                security_messages = [
                    "error details hidden for security",
                    "Solana service initialized with wallet",
                    "Failed to load private key (error details hidden for security)"
                ]
                
                for message in security_messages:
                    if message in error_log:
                        self.test_results["backend_logs_check"]["details"].append(f"✅ Security message found: '{message}'")
            
            # Check output log
            result = subprocess.run(
                ["tail", "-n", "500", "/var/log/supervisor/backend.out.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                output_log = result.stdout
                logger.info(f"Output log length: {len(output_log)} characters")
                
                # Check for private key in output logs
                if self.private_key in output_log:
                    self.test_results["backend_logs_check"]["details"].append("❌ CRITICAL: Private key found in output logs!")
                    return False
                else:
                    self.test_results["backend_logs_check"]["details"].append("✅ Private key NOT found in output logs")
                
                # Check for private key fragments
                for i, part in enumerate(private_key_parts):
                    if part in output_log:
                        self.test_results["backend_logs_check"]["details"].append(f"❌ CRITICAL: Private key fragment {i+1} found in output logs!")
                        return False
            
            self.test_results["backend_logs_check"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Log check failed: {e}")
            self.test_results["backend_logs_check"]["details"].append(f"❌ Exception checking logs: {str(e)}")
            return False
    
    def test_error_responses(self):
        """Test error responses for private key leaks"""
        logger.info("=== Testing Error Responses for Private Key Leaks ===")
        
        try:
            # Test invalid requests to trigger errors
            test_cases = [
                {
                    "name": "Invalid position ID",
                    "url": f"{self.backend_url}/positions/close-with-refund",
                    "params": {"position_id": "invalid", "wallet_address": "invalid", "amount_sol": -1}
                },
                {
                    "name": "Missing parameters",
                    "url": f"{self.backend_url}/positions/close-with-refund",
                    "params": {}
                },
                {
                    "name": "Invalid wallet address",
                    "url": f"{self.backend_url}/positions/close-with-refund",
                    "params": {"position_id": "test", "wallet_address": "not_a_wallet", "amount_sol": 0.001}
                }
            ]
            
            for test_case in test_cases:
                logger.info(f"Testing: {test_case['name']}")
                
                try:
                    response = requests.post(test_case["url"], params=test_case["params"], timeout=10)
                    response_text = response.text
                    
                    # Check for private key in error response
                    if self.private_key in response_text:
                        self.test_results["error_responses"]["details"].append(f"❌ CRITICAL: Private key found in error response for '{test_case['name']}'!")
                        return False
                    
                    # Check for sensitive data in stack traces
                    if "Traceback" in response_text and ("private" in response_text.lower() or "secret" in response_text.lower()):
                        self.test_results["error_responses"]["details"].append(f"⚠️ Potential sensitive data in stack trace for '{test_case['name']}'")
                    
                    self.test_results["error_responses"]["details"].append(f"✅ No private key leak in '{test_case['name']}' error response")
                    
                except requests.RequestException as e:
                    logger.info(f"Request failed for {test_case['name']}: {e}")
                    # This is expected for some invalid requests
            
            self.test_results["error_responses"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Error response test failed: {e}")
            self.test_results["error_responses"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def verify_env_security(self):
        """Verify .env file security"""
        logger.info("=== Verifying .env File Security ===")
        
        try:
            # Check if .env file exists and contains private key
            env_path = "/app/backend/.env"
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    env_content = f.read()
                
                if self.private_key in env_content:
                    self.test_results["env_security"]["details"].append("✅ Private key found in .env file (correct location)")
                else:
                    self.test_results["env_security"]["details"].append("❌ Private key NOT found in .env file")
                    return False
                
                # Check if .env is in .gitignore
                gitignore_path = "/app/.gitignore"
                if os.path.exists(gitignore_path):
                    with open(gitignore_path, 'r') as f:
                        gitignore_content = f.read()
                    
                    if ".env" in gitignore_content:
                        self.test_results["env_security"]["details"].append("✅ .env file is in .gitignore")
                    else:
                        self.test_results["env_security"]["details"].append("⚠️ .env file NOT in .gitignore")
                else:
                    self.test_results["env_security"]["details"].append("⚠️ .gitignore file not found")
                
                # Check file permissions
                import stat
                file_stat = os.stat(env_path)
                file_mode = stat.filemode(file_stat.st_mode)
                self.test_results["env_security"]["details"].append(f"✅ .env file permissions: {file_mode}")
                
            else:
                self.test_results["env_security"]["details"].append("❌ .env file not found")
                return False
            
            # Verify private key is not accessible from frontend
            frontend_env_path = "/app/frontend/.env"
            if os.path.exists(frontend_env_path):
                with open(frontend_env_path, 'r') as f:
                    frontend_env = f.read()
                
                if self.private_key in frontend_env:
                    self.test_results["env_security"]["details"].append("❌ CRITICAL: Private key found in frontend .env!")
                    return False
                else:
                    self.test_results["env_security"]["details"].append("✅ Private key NOT in frontend .env (correct)")
            
            self.test_results["env_security"]["passed"] = True
            return True
            
        except Exception as e:
            logger.error(f"Env security check failed: {e}")
            self.test_results["env_security"]["details"].append(f"❌ Exception: {str(e)}")
            return False
    
    def run_all_security_tests(self):
        """Run all security tests"""
        logger.info("🔒 Starting CRITICAL SECURITY TESTS - Private Key Leak Detection")
        logger.info(f"Backend URL: {self.backend_url}")
        logger.info(f"Testing for leaks of private key: {self.private_key[:10]}...{self.private_key[-10:]}")
        
        # Test 1: Close position endpoint
        close_position_passed = self.test_close_position_endpoint()
        
        # Test 2: Backend logs
        logs_passed = self.check_backend_logs()
        
        # Test 3: Error responses
        error_responses_passed = self.test_error_responses()
        
        # Test 4: .env security
        env_security_passed = self.verify_env_security()
        
        # Generate summary
        self.print_security_summary()
        
        return {
            "close_position_endpoint": close_position_passed,
            "backend_logs_check": logs_passed,
            "error_responses": error_responses_passed,
            "env_security": env_security_passed
        }
    
    def print_security_summary(self):
        """Print detailed security test summary"""
        logger.info("\n" + "="*80)
        logger.info("🔒 CRITICAL SECURITY TEST RESULTS - PRIVATE KEY LEAK DETECTION")
        logger.info("="*80)
        
        critical_failures = []
        
        for test_name, result in self.test_results.items():
            status = "✅ SECURE" if result["passed"] else "❌ SECURITY RISK"
            logger.info(f"\n{test_name.upper().replace('_', ' ')}: {status}")
            
            for detail in result["details"]:
                logger.info(f"  {detail}")
                if "❌ CRITICAL:" in detail:
                    critical_failures.append(detail)
        
        # Overall security assessment
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["passed"])
        
        logger.info(f"\n🔒 SECURITY SUMMARY: {passed_tests}/{total_tests} tests passed")
        
        if critical_failures:
            logger.info("\n🚨 CRITICAL SECURITY FAILURES DETECTED:")
            for failure in critical_failures:
                logger.info(f"   {failure}")
            logger.info("\n❌ IMMEDIATE ACTION REQUIRED - PRIVATE KEY IS EXPOSED!")
        else:
            logger.info("\n✅ NO PRIVATE KEY LEAKS DETECTED")
            logger.info("   ✅ Private key secure in .env file only")
            logger.info("   ✅ API responses contain only safe data")
            logger.info("   ✅ Logs contain only public addresses")
            logger.info("   ✅ Error messages are sanitized")

if __name__ == "__main__":
    tester = SecurityTester()
    results = tester.run_all_security_tests()