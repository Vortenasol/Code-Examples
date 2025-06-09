import requests
import time
import json
from typing import Optional, Dict, Any

# Configuration
API_BASE_URL = "https://api.vortena.xyz"
PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"  # Replace with your Base58 encoded private key
TOKEN_MINT = "TOKEN_MINT_ADDRESS_HERE"  # Replace with token contract address

# Trading parameters
TRADE_CONFIG = {
    "percentage": 50,      # Percentage of holdings to sell (1-100)
    "slippage": 5,         # 5% slippage tolerance
    "priority_fee": 0.003  # Priority fee in SOL
}

class VortenaSeller:
    """VORTENA API Selling Client"""
    
    def __init__(self, private_key: str, base_url: str = API_BASE_URL):
        self.private_key = private_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
    
    def sell_tokens(self, mint: str, percentage: int, slippage: int = 5, priority_fee: float = 0.003) -> Optional[Dict[str, Any]]:
        """
        Execute a sell trade
        
        Args:
            mint: Token mint address
            percentage: Percentage of holdings to sell (1-100)
            slippage: Slippage tolerance in percentage
            priority_fee: Priority fee in SOL
            
        Returns:
            Trade result dictionary or None if failed
        """
        url = f"{self.base_url}/trade/sell/{mint}/{percentage}/{slippage}/{priority_fee}/{self.private_key}"
        
        try:
            print("🔄 Executing sell trade...")
            print(f"Token: {mint}")
            print(f"Percentage: {percentage}%")
            print(f"Slippage: {slippage}%")
            print(f"Priority Fee: {priority_fee} SOL")
            
            response = self.session.get(url)
            response.raise_for_status()
            result = response.json()
            
            if result.get("success"):
                print("✅ Trade successful!")
                print(f"Transaction Hash: {result.get('tx_hash', 'N/A')}")
                print(f"Solscan URL: {result.get('solscan_url', 'N/A')}")
                print(f"SOL Received: {result.get('sol_received', 'N/A')} SOL")
                print(f"Tokens Sold: {result.get('tokens_sold', 'N/A')} tokens")
                return result
            else:
                print(f"❌ Trade failed: {result.get('error', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error: {str(e)}")
            return None
        except json.JSONDecodeError:
            print("❌ Invalid JSON response")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return None
    
    def sell_with_retry(self, mint: str, percentage: int, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """
        Sell tokens with retry logic
        
        Args:
            mint: Token mint address
            percentage: Percentage of holdings to sell (1-100)
            max_retries: Maximum number of retry attempts
            
        Returns:
            Trade result dictionary or None if all attempts failed
        """
        for attempt in range(1, max_retries + 1):
            print(f"\n🔄 Attempt {attempt}/{max_retries}")
            
            try:
                # Increase slippage on retries
                slippage = TRADE_CONFIG["slippage"] + (attempt - 1) * 2
                result = self.sell_tokens(mint, percentage, slippage, TRADE_CONFIG["priority_fee"])
                
                if result and result.get("success"):
                    return result
                
                if attempt < max_retries:
                    print("⏳ Waiting 3 seconds before retry...")
                    time.sleep(3)
                    
            except Exception as e:
                print(f"❌ Attempt {attempt} failed: {str(e)}")
                
                if attempt < max_retries:
                    print("⏳ Waiting 3 seconds before retry...")
                    time.sleep(3)
        
        print("❌ All retry attempts failed")
        return None
    
    def sell_all(self, mint: str) -> Optional[Dict[str, Any]]:
        """Sell all tokens (100%)"""
        print("💰 Selling all tokens (100%)...")
        return self.sell_with_retry(mint, 100)
    
    def sell_half(self, mint: str) -> Optional[Dict[str, Any]]:
        """Sell half of the tokens (50%)"""
        print("📊 Selling half of tokens (50%)...")
        return self.sell_with_retry(mint, 50)
    
    def sell_custom(self, mint: str, percentage: int) -> Optional[Dict[str, Any]]:
        """Sell a custom percentage of tokens"""
        if percentage < 1 or percentage > 100:
            raise ValueError("Percentage must be between 1 and 100")
        
        print(f"📈 Selling {percentage}% of tokens...")
        return self.sell_with_retry(mint, percentage)
    
    def interactive_sell(self, mint: str) -> Optional[Dict[str, Any]]:
        """Interactive sell with predefined options"""
        print("🎯 Interactive Sell Options:")
        print("1. Sell 25% of holdings")
        print("2. Sell 50% of holdings") 
        print("3. Sell 75% of holdings")
        print("4. Sell all holdings (100%)")
        
        # For demo purposes, let's sell 50%
        choice = 2
        percentages = [25, 50, 75, 100]
        percentage = percentages[choice - 1]
        
        print(f"\n🔥 Executing: Sell {percentage}% of holdings")
        return self.sell_with_retry(mint, percentage)

def validate_params(mint: str, percentage: int, slippage: int, priority_fee: float):
    """Validate trading parameters"""
    if not mint or mint == "TOKEN_MINT_ADDRESS_HERE":
        raise ValueError("Please provide a valid token mint address")
    
    if not PRIVATE_KEY or PRIVATE_KEY == "YOUR_PRIVATE_KEY_HERE":
        raise ValueError("Please provide your private key")
    
    if percentage < 1 or percentage > 100:
        raise ValueError("Percentage must be between 1 and 100")
    
    if slippage < 0.1 or slippage > 50:
        raise ValueError("Slippage must be between 0.1% and 50%")
    
    if priority_fee < 0:
        raise ValueError("Priority fee must be non-negative")

def main():
    """Main execution function"""
    try:
        # Validate parameters
        validate_params(
            TOKEN_MINT, 
            TRADE_CONFIG["percentage"], 
            TRADE_CONFIG["slippage"], 
            TRADE_CONFIG["priority_fee"]
        )
        
        print("🚀 Starting VORTENA Sell Trade Example")
        print("======================================")
        
        # Initialize seller
        seller = VortenaSeller(PRIVATE_KEY)
        
        # Example 1: Sell custom percentage
        print("\n📊 Example 1: Sell Custom Percentage")
        result1 = seller.sell_custom(TOKEN_MINT, TRADE_CONFIG["percentage"])
        
        if result1:
            print("\n🎉 Custom sell completed successfully!")
            print(f"Result: {json.dumps(result1, indent=2)}")
        else:
            print("\n💥 Custom sell failed")
        
        # Uncomment below for additional examples:
        
        # Example 2: Sell half
        # print("\n📊 Example 2: Sell Half (50%)")
        # result2 = seller.sell_half(TOKEN_MINT)
        
        # Example 3: Sell all  
        # print("\n💰 Example 3: Sell All (100%)")
        # result3 = seller.sell_all(TOKEN_MINT)
        
        # Example 4: Interactive sell
        # print("\n🎯 Example 4: Interactive Sell")
        # result4 = seller.interactive_sell(TOKEN_MINT)
            
    except ValueError as e:
        print(f"❌ Configuration error: {str(e)}")
        print("\n📝 Please check your configuration:")
        print("1. Set your private key in PRIVATE_KEY variable")
        print("2. Set the token mint address in TOKEN_MINT variable")
        print("3. Adjust trading parameters in TRADE_CONFIG if needed")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

def demo_multiple_sell_strategies():
    """Demonstrate different selling strategies"""
    try:
        validate_params(TOKEN_MINT, 25, TRADE_CONFIG["slippage"], TRADE_CONFIG["priority_fee"])
        
        print("🎯 Demo: Multiple Sell Strategies")
        print("=================================")
        
        seller = VortenaSeller(PRIVATE_KEY)
        
        strategies = [
            ("Conservative", 25),  # Sell 25%
            ("Moderate", 50),      # Sell 50%
            ("Aggressive", 75),    # Sell 75%
        ]
        
        for strategy_name, percentage in strategies:
            print(f"\n📊 {strategy_name} Strategy: Sell {percentage}%")
            result = seller.sell_custom(TOKEN_MINT, percentage)
            
            if result:
                print(f"✅ {strategy_name} strategy completed!")
            else:
                print(f"❌ {strategy_name} strategy failed!")
            
            # Add delay between strategies for safety
            print("⏳ Waiting 5 seconds before next strategy...")
            time.sleep(5)
            
    except Exception as e:
        print(f"❌ Demo error: {str(e)}")

if __name__ == "__main__":
    main()
    
    # Uncomment to run the demo
    # demo_multiple_sell_strategies() 