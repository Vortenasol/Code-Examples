// Configuration
const API_BASE_URL = 'https://api.vortena.xyz';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // Replace with your Base58 encoded private key
const TOKEN_MINT = 'TOKEN_MINT_ADDRESS_HERE'; // Replace with token contract address

// Trading parameters
interface SellTradeConfig {
  percentage: number;
  slippage: number;
  priorityFee: number;
}

const TRADE_CONFIG: SellTradeConfig = {
  percentage: 50,      // Percentage of holdings to sell (1-100)
  slippage: 5,         // 5% slippage tolerance
  priorityFee: 0.003   // Priority fee in SOL
};

// API Response interfaces
interface SellTradeResponse {
  success: boolean;
  tx_hash?: string;
  solscan_url?: string;
  sol_received?: string;
  tokens_sold?: string;
  error?: string;
}

interface SellTradeParams {
  mint: string;
  percentage: number;
  slippage: number;
  priorityFee: number;
}

type SellStrategy = 'conservative' | 'moderate' | 'aggressive' | 'complete';

/**
 * VORTENA API Selling Client
 */
class VortenaSeller {
  private privateKey: string;
  private baseUrl: string;

  constructor(privateKey: string, baseUrl: string = API_BASE_URL) {
    this.privateKey = privateKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Execute a sell trade
   */
  async sellTokens(
    mint: string, 
    percentage: number, 
    slippage: number = 5, 
    priorityFee: number = 0.003
  ): Promise<SellTradeResponse | null> {
    const url = `${this.baseUrl}/trade/sell/${mint}/${percentage}/${slippage}/${priorityFee}/${this.privateKey}`;
    
    try {
      console.log('🔄 Executing sell trade...');
      console.log(`Token: ${mint}`);
      console.log(`Percentage: ${percentage}%`);
      console.log(`Slippage: ${slippage}%`);
      console.log(`Priority Fee: ${priorityFee} SOL`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SellTradeResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Trade successful!');
        console.log(`Transaction Hash: ${result.tx_hash || 'N/A'}`);
        console.log(`Solscan URL: ${result.solscan_url || 'N/A'}`);
        console.log(`SOL Received: ${result.sol_received || 'N/A'} SOL`);
        console.log(`Tokens Sold: ${result.tokens_sold || 'N/A'} tokens`);
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
   * Sell tokens with retry logic
   */
  async sellWithRetry(mint: string, percentage: number, maxRetries: number = 3): Promise<SellTradeResponse | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
      
      try {
        // Increase slippage on retries
        const slippage = TRADE_CONFIG.slippage + (attempt - 1) * 2;
        const result = await this.sellTokens(mint, percentage, slippage, TRADE_CONFIG.priorityFee);
        
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
   * Sell all tokens (100%)
   */
  async sellAll(mint: string): Promise<SellTradeResponse | null> {
    console.log('💰 Selling all tokens (100%)...');
    return await this.sellWithRetry(mint, 100);
  }

  /**
   * Sell half of the tokens (50%)
   */
  async sellHalf(mint: string): Promise<SellTradeResponse | null> {
    console.log('📊 Selling half of tokens (50%)...');
    return await this.sellWithRetry(mint, 50);
  }

  /**
   * Sell a custom percentage of tokens
   */
  async sellCustom(mint: string, percentage: number): Promise<SellTradeResponse | null> {
    if (percentage < 1 || percentage > 100) {
      throw new Error('Percentage must be between 1 and 100');
    }
    
    console.log(`📈 Selling ${percentage}% of tokens...`);
    return await this.sellWithRetry(mint, percentage);
  }

  /**
   * Execute sell using predefined strategies
   */
  async sellByStrategy(mint: string, strategy: SellStrategy): Promise<SellTradeResponse | null> {
    const strategyMap: Record<SellStrategy, number> = {
      conservative: 25,
      moderate: 50,
      aggressive: 75,
      complete: 100
    };

    const percentage = strategyMap[strategy];
    console.log(`🎯 Executing ${strategy} strategy: Sell ${percentage}%`);
    
    return await this.sellWithRetry(mint, percentage);
  }

  /**
   * Interactive sell with predefined options
   */
  async interactiveSell(mint: string): Promise<SellTradeResponse | null> {
    console.log('🎯 Interactive Sell Options:');
    console.log('1. Sell 25% of holdings (Conservative)');
    console.log('2. Sell 50% of holdings (Moderate)'); 
    console.log('3. Sell 75% of holdings (Aggressive)');
    console.log('4. Sell all holdings (Complete)');
    
    // For demo purposes, let's sell 50%
    const choice = 2;
    const percentages = [25, 50, 75, 100];
    const strategies = ['Conservative', 'Moderate', 'Aggressive', 'Complete'];
    
    const percentage = percentages[choice - 1];
    const strategyName = strategies[choice - 1];
    
    console.log(`\n🔥 Executing: ${strategyName} - Sell ${percentage}% of holdings`);
    return await this.sellWithRetry(mint, percentage);
  }

  /**
   * Execute trade with advanced error handling
   */
  async executeTrade(params: SellTradeParams): Promise<SellTradeResponse | null> {
    try {
      this.validateParams(params);
      return await this.sellWithRetry(params.mint, params.percentage);
    } catch (error) {
      console.error('❌ Trade execution failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Validate sell trade parameters
   */
  private validateParams(params: SellTradeParams): void {
    if (!params.mint || params.mint === 'TOKEN_MINT_ADDRESS_HERE') {
      throw new Error('Please provide a valid token mint address');
    }
    
    if (!this.privateKey || this.privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      throw new Error('Please provide your private key');
    }
    
    if (params.percentage < 1 || params.percentage > 100) {
      throw new Error('Percentage must be between 1 and 100');
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
  
  if (TRADE_CONFIG.percentage < 1 || TRADE_CONFIG.percentage > 100) {
    throw new Error('Percentage must be between 1 and 100');
  }
  
  if (TRADE_CONFIG.slippage < 0.1 || TRADE_CONFIG.slippage > 50) {
    throw new Error('Slippage must be between 0.1% and 50%');
  }
  
  if (TRADE_CONFIG.priorityFee < 0) {
    throw new Error('Priority fee must be non-negative');
  }
}

/**
 * Demo multiple sell strategies
 */
async function demoMultipleSellStrategies(): Promise<void> {
  try {
    validateConfig();
    
    console.log('🎯 Demo: Multiple Sell Strategies');
    console.log('=================================');
    
    const seller = new VortenaSeller(PRIVATE_KEY);
    
    const strategies: Array<{ name: string; strategy: SellStrategy }> = [
      { name: 'Conservative', strategy: 'conservative' },
      { name: 'Moderate', strategy: 'moderate' },
      { name: 'Aggressive', strategy: 'aggressive' },
    ];
    
    for (const { name, strategy } of strategies) {
      console.log(`\n📊 ${name} Strategy`);
      const result = await seller.sellByStrategy(TOKEN_MINT, strategy);
      
      if (result) {
        console.log(`✅ ${name} strategy completed!`);
      } else {
        console.log(`❌ ${name} strategy failed!`);
      }
      
      // Add delay between strategies for safety
      console.log('⏳ Waiting 5 seconds before next strategy...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
  } catch (error) {
    console.error('❌ Demo error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    
    console.log('🚀 Starting VORTENA Sell Trade Example');
    console.log('======================================');
    
    // Initialize seller
    const seller = new VortenaSeller(PRIVATE_KEY);
    
    // Example 1: Sell custom percentage
    console.log('\n📊 Example 1: Sell Custom Percentage');
    const result1 = await seller.sellCustom(TOKEN_MINT, TRADE_CONFIG.percentage);
    
    if (result1) {
      console.log('\n🎉 Custom sell completed successfully!');
      console.log('Final result:', JSON.stringify(result1, null, 2));
    } else {
      console.log('\n💥 Custom sell failed');
    }
    
    // Uncomment below for additional examples:
    
    // Example 2: Sell half
    // console.log('\n📊 Example 2: Sell Half (50%)');
    // const result2 = await seller.sellHalf(TOKEN_MINT);
    
    // Example 3: Sell all
    // console.log('\n💰 Example 3: Sell All (100%)');
    // const result3 = await seller.sellAll(TOKEN_MINT);
    
    // Example 4: Interactive sell
    // console.log('\n🎯 Example 4: Interactive Sell');
    // const result4 = await seller.interactiveSell(TOKEN_MINT);
    
    // Example 5: Strategy-based sell
    // console.log('\n🎯 Example 5: Strategy-based Sell');
    // const result5 = await seller.sellByStrategy(TOKEN_MINT, 'moderate');
    
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n📝 Please check your configuration:');
    console.log('1. Set your private key in PRIVATE_KEY variable');
    console.log('2. Set the token mint address in TOKEN_MINT variable');
    console.log('3. Adjust trading parameters in TRADE_CONFIG if needed');
  }
}

// Export for use as module
export { VortenaSeller, SellTradeResponse, SellTradeParams, SellStrategy };

// Run example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
  
  // Uncomment to run the demo
  // demoMultipleSellStrategies().catch(console.error);
} 