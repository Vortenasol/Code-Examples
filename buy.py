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
    "amount": 0.01,        # SOL amount to spend
    "slippage": 5,         # 5% slippage tolerance
    "priority_fee": 0.003  # Priority fee in SOL
}

class VortenaTrader:
    """VORTENA API Trading Client"""
    
    def __init__(self, private_key: str, base_url: str = API_BASE_URL):
        self.private_key = private_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
    
    def buy_tokens(self, mint: str, amount: float, slippage: int = 5, priority_fee: float = 0.003) -> Optional[Dict[str, Any]]:
        """
        Execute a buy trade
        
        Args:
            mint: Token mint address
            amount: SOL amount to spend
            slippage: Slippage tolerance in percentage
            priority_fee: Priority fee in SOL
            
        Returns:
            Trade result dictionary or None if failed
        """
        url = f"{self.base_url}/trade/buy/{mint}/{amount}/{slippage}/{priority_fee}/{self.private_key}"
        
        try:
            print("🔄 Executing buy trade...")
            print(f"Token: {mint}")
            print(f"Amount: {amount} SOL")
            print(f"Slippage: {slippage}%")
            print(f"Priority Fee: {priority_fee} SOL")
            
            response = self.session.get(url)
            response.raise_for_status()
            result = response.json()
            
            if result.get("success"):
                print("✅ Trade successful!")
                print(f"Transaction Hash: {result.get('tx_hash', 'N/A')}")
                print(f"Solscan URL: {result.get('solscan_url', 'N/A')}")
                print(f"Amount Received: {result.get('amount_received', 'N/A')} tokens")
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
    
    def buy_with_retry(self, mint: str, amount: float, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """
        Buy tokens with retry logic
        
        Args:
            mint: Token mint address
            amount: SOL amount to spend
            max_retries: Maximum number of retry attempts
            
        Returns:
            Trade result dictionary or None if all attempts failed
        """
        for attempt in range(1, max_retries + 1):
            print(f"\n🔄 Attempt {attempt}/{max_retries}")
            
            try:
                # Increase slippage on retries
                slippage = TRADE_CONFIG["slippage"] + (attempt - 1) * 2
                result = self.buy_tokens(mint, amount, slippage, TRADE_CONFIG["priority_fee"])
                
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

def validate_params(mint: str, amount: float, slippage: int, priority_fee: float):
    """Validate trading parameters"""
    if not mint or mint == "TOKEN_MINT_ADDRESS_HERE":
        raise ValueError("Please provide a valid token mint address")
    
    if not PRIVATE_KEY or PRIVATE_KEY == "YOUR_PRIVATE_KEY_HERE":
        raise ValueError("Please provide your private key")
    
    if amount <= 0:
        raise ValueError("Amount must be greater than 0")
    
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
            TRADE_CONFIG["amount"], 
            TRADE_CONFIG["slippage"], 
            TRADE_CONFIG["priority_fee"]
        )
        
        print("🚀 Starting VORTENA Buy Trade Example")
        print("=====================================")
        
        # Initialize trader
        trader = VortenaTrader(PRIVATE_KEY)
        
        # Execute trade with retry logic
        result = trader.buy_with_retry(TOKEN_MINT, TRADE_CONFIG["amount"])
        
        if result:
            print("\n🎉 Trade completed successfully!")
            print(f"Final result: {json.dumps(result, indent=2)}")
        else:
            print("\n💥 Trade failed after all retries")
            
    except ValueError as e:
        print(f"❌ Configuration error: {str(e)}")
        print("\n📝 Please check your configuration:")
        print("1. Set your private key in PRIVATE_KEY variable")
        print("2. Set the token mint address in TOKEN_MINT variable")
        print("3. Adjust trading parameters in TRADE_CONFIG if needed")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main() 