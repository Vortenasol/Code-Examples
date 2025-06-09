// Configuration
const API_BASE_URL = 'https://api.vortena.xyz';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // Replace with your Base58 encoded private key
const TOKEN_MINT = 'TOKEN_MINT_ADDRESS_HERE'; // Replace with token contract address

// Trading parameters
interface TradeConfig {
  amount: number;
  slippage: number;
  priorityFee: number;
}

const TRADE_CONFIG: TradeConfig = {
  amount: 0.01,        // SOL amount to spend
  slippage: 5,         // 5% slippage tolerance
  priorityFee: 0.003   // Priority fee in SOL
};

// API Response interfaces
interface TradeResponse {
  success: boolean;
  tx_hash?: string;
  solscan_url?: string;
  amount_received?: string;
  error?: string;
}

interface TradeParams {
  mint: string;
  amount: number;
  slippage: number;
  priorityFee: number;
}

/**
 * VORTENA API Trading Client
 */
class VortenaTrader {
  private privateKey: string;
  private baseUrl: string;

  constructor(privateKey: string, baseUrl: string = API_BASE_URL) {
    this.privateKey = privateKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Execute a buy trade
   */
  async buyTokens(
    mint: string, 
    amount: number, 
    slippage: number = 5, 
    priorityFee: number = 0.003
  ): Promise<TradeResponse | null> {
    const url = `${this.baseUrl}/trade/buy/${mint}/${amount}/${slippage}/${priorityFee}/${this.privateKey}`;
    
    try {
      console.log('🔄 Executing buy trade...');
      console.log(`Token: ${mint}`);
      console.log(`Amount: ${amount} SOL`);
      console.log(`Slippage: ${slippage}%`);
      console.log(`Priority Fee: ${priorityFee} SOL`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: TradeResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Trade successful!');
        console.log(`Transaction Hash: ${result.tx_hash || 'N/A'}`);
        console.log(`Solscan URL: ${result.solscan_url || 'N/A'}`);
        console.log(`Amount Received: ${result.amount_received || 'N/A'} tokens`);
        return result;
      } else {
        console.error('❌ Trade failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error executing trade:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Buy tokens with retry logic
   */
  async buyWithRetry(mint: string, amount: number, maxRetries: number = 3): Promise<TradeResponse | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
      
      try {
        // Increase slippage on retries
        const slippage = TRADE_CONFIG.slippage + (attempt - 1) * 2;
        const result = await this.buyTokens(mint, amount, slippage, TRADE_CONFIG.priorityFee);
        
        if (result?.success) {
          return result;
        }
        
        if (attempt < maxRetries) {
          console.log('⏳ Waiting 3 seconds before retry...');
          await this.delay(3000);
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        if (attempt < maxRetries) {
          console.log('⏳ Waiting 3 seconds before retry...');
          await this.delay(3000);
        }
      }
    }
    
    console.error('❌ All retry attempts failed');
    return null;
  }

  /**
   * Execute trade with advanced error handling
   */
  async executeTrade(params: TradeParams): Promise<TradeResponse | null> {
    try {
      this.validateParams(params);
      return await this.buyWithRetry(params.mint, params.amount);
    } catch (error) {
      console.error('❌ Trade execution failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Validate trade parameters
   */
  private validateParams(params: TradeParams): void {
    if (!params.mint || params.mint === 'TOKEN_MINT_ADDRESS_HERE') {
      throw new Error('Please provide a valid token mint address');
    }
    
    if (!this.privateKey || this.privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      throw new Error('Please provide your private key');
    }
    
    if (params.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (params.slippage < 0.1 || params.slippage > 50) {
      throw new Error('Slippage must be between 0.1% and 50%');
    }
    
    if (params.priorityFee < 0) {
      throw new Error('Priority fee must be non-negative');
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Validate global configuration parameters
 */
function validateConfig(): void {
  if (!TOKEN_MINT || TOKEN_MINT === 'TOKEN_MINT_ADDRESS_HERE') {
    throw new Error('Please provide a valid token mint address');
  }
  
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('Please provide your private key');
  }
  
  if (TRADE_CONFIG.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (TRADE_CONFIG.slippage < 0.1 || TRADE_CONFIG.slippage > 50) {
    throw new Error('Slippage must be between 0.1% and 50%');
  }
  
  if (TRADE_CONFIG.priorityFee < 0) {
    throw new Error('Priority fee must be non-negative');
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    
    console.log('🚀 Starting VORTENA Buy Trade Example');
    console.log('=====================================');
    
    // Initialize trader
    const trader = new VortenaTrader(PRIVATE_KEY);
    
    // Execute trade with retry logic
    const result = await trader.buyWithRetry(TOKEN_MINT, TRADE_CONFIG.amount);
    
    if (result) {
      console.log('\n🎉 Trade completed successfully!');
      console.log('Final result:', JSON.stringify(result, null, 2));
    } else {
      console.log('\n💥 Trade failed after all retries');
    }
    
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n📝 Please check your configuration:');
    console.log('1. Set your private key in PRIVATE_KEY variable');
    console.log('2. Set the token mint address in TOKEN_MINT variable');
    console.log('3. Adjust trading parameters in TRADE_CONFIG if needed');
  }
}

// Export for use as module
export { VortenaTrader, TradeResponse, TradeParams };

// Run example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 