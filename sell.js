const https = require('https');

// Configuration
const API_BASE_URL = 'https://api.vortena.xyz';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // Replace with your Base58 encoded private key
const TOKEN_MINT = 'TOKEN_MINT_ADDRESS_HERE'; // Replace with token contract address

// Trading parameters
const TRADE_CONFIG = {
  percentage: 50,      // Percentage of holdings to sell (1-100)
  slippage: 5,         // 5% slippage tolerance
  priorityFee: 0.003   // Priority fee in SOL
};

/**
 * Execute a sell trade
 */
async function sellTokens(mint, percentage, slippage = 5, priorityFee = 0.003) {
  const url = `${API_BASE_URL}/trade/sell/${mint}/${percentage}/${slippage}/${priorityFee}/${PRIVATE_KEY}`;
  
  try {
    console.log('🔄 Executing sell trade...');
    console.log(`Token: ${mint}`);
    console.log(`Percentage: ${percentage}%`);
    console.log(`Slippage: ${slippage}%`);
    console.log(`Priority Fee: ${priorityFee} SOL`);
    
    const response = await fetch(url);
    const result = await response.json();
    
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
    console.error('❌ Error executing trade:', error.message);
    return null;
  }
}

/**
 * Sell tokens with retry logic
 */
async function sellWithRetry(mint, percentage, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
    
    try {
      // Increase slippage on retries
      const slippage = TRADE_CONFIG.slippage + (attempt - 1) * 2;
      const result = await sellTokens(mint, percentage, slippage, TRADE_CONFIG.priorityFee);
      
      if (result && result.success) {
        return result;
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 3 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 3 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  console.error('❌ All retry attempts failed');
  return null;
}

/**
 * Sell all tokens (100%)
 */
async function sellAll(mint) {
  console.log('💰 Selling all tokens (100%)...');
  return await sellWithRetry(mint, 100);
}

/**
 * Sell half of the tokens (50%)
 */
async function sellHalf(mint) {
  console.log('📊 Selling half of tokens (50%)...');
  return await sellWithRetry(mint, 50);
}

/**
 * Sell a custom percentage of tokens
 */
async function sellCustom(mint, percentage) {
  if (percentage < 1 || percentage > 100) {
    throw new Error('Percentage must be between 1 and 100');
  }
  
  console.log(`📈 Selling ${percentage}% of tokens...`);
  return await sellWithRetry(mint, percentage);
}

/**
 * Validate trade parameters
 */
function validateParams(mint, percentage, slippage, priorityFee) {
  if (!mint || mint === 'TOKEN_MINT_ADDRESS_HERE') {
    throw new Error('Please provide a valid token mint address');
  }
  
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('Please provide your private key');
  }
  
  if (percentage < 1 || percentage > 100) {
    throw new Error('Percentage must be between 1 and 100');
  }
  
  if (slippage < 0.1 || slippage > 50) {
    throw new Error('Slippage must be between 0.1% and 50%');
  }
  
  if (priorityFee < 0) {
    throw new Error('Priority fee must be non-negative');
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Validate parameters
    validateParams(TOKEN_MINT, TRADE_CONFIG.percentage, TRADE_CONFIG.slippage, TRADE_CONFIG.priorityFee);
    
    console.log('🚀 Starting VORTENA Sell Trade Example');
    console.log('======================================');
    
    // Example 1: Sell custom percentage
    console.log('\n📊 Example 1: Sell Custom Percentage');
    const result1 = await sellCustom(TOKEN_MINT, TRADE_CONFIG.percentage);
    
    if (result1) {
      console.log('\n🎉 Custom sell completed successfully!');
    } else {
      console.log('\n💥 Custom sell failed');
    }
    
    // Uncomment below for additional examples:
    
    // Example 2: Sell half
    // console.log('\n📊 Example 2: Sell Half (50%)');
    // const result2 = await sellHalf(TOKEN_MINT);
    
    // Example 3: Sell all
    // console.log('\n💰 Example 3: Sell All (100%)');
    // const result3 = await sellAll(TOKEN_MINT);
    
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    console.log('\n📝 Please check your configuration:');
    console.log('1. Set your private key in PRIVATE_KEY variable');
    console.log('2. Set the token mint address in TOKEN_MINT variable');
    console.log('3. Adjust trading parameters in TRADE_CONFIG if needed');
  }
}

/**
 * Interactive sell function with user choices
 */
async function interactiveSell() {
  try {
    validateParams(TOKEN_MINT, 50, TRADE_CONFIG.slippage, TRADE_CONFIG.priorityFee);
    
    console.log('🎯 Interactive Sell Options:');
    console.log('1. Sell 25% of holdings');
    console.log('2. Sell 50% of holdings');
    console.log('3. Sell 75% of holdings');
    console.log('4. Sell all holdings (100%)');
    
    // For demo purposes, let's sell 50%
    const choice = 2;
    const percentages = [25, 50, 75, 100];
    const percentage = percentages[choice - 1];
    
    console.log(`\n🔥 Executing: Sell ${percentage}% of holdings`);
    const result = await sellWithRetry(TOKEN_MINT, percentage);
    
    if (result) {
      console.log('\n🎉 Interactive sell completed successfully!');
      return result;
    } else {
      console.log('\n💥 Interactive sell failed');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Interactive sell error:', error.message);
    return null;
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  sellTokens, 
  sellWithRetry, 
  sellAll, 
  sellHalf, 
  sellCustom, 
  interactiveSell 
}; 