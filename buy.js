const https = require('https');

// Configuration
const API_BASE_URL = 'https://api.vortena.xyz';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // Replace with your Base58 encoded private key
const TOKEN_MINT = 'TOKEN_MINT_ADDRESS_HERE'; // Replace with token contract address

// Trading parameters
const TRADE_CONFIG = {
  amount: 0.01,        // SOL amount to spend
  slippage: 5,         // 5% slippage tolerance
  priorityFee: 0.003   // Priority fee in SOL
};

/**
 * Execute a buy trade
 */
async function buyTokens(mint, amount, slippage = 5, priorityFee = 0.003) {
  const url = `${API_BASE_URL}/trade/buy/${mint}/${amount}/${slippage}/${priorityFee}/${PRIVATE_KEY}`;
  
  try {
    console.log('🔄 Executing buy trade...');
    console.log(`Token: ${mint}`);
    console.log(`Amount: ${amount} SOL`);
    console.log(`Slippage: ${slippage}%`);
    console.log(`Priority Fee: ${priorityFee} SOL`);
    
    const response = await fetch(url);
    const result = await response.json();
    
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
    console.error('❌ Error executing trade:', error.message);
    return null;
  }
}

/**
 * Buy tokens with retry logic
 */
async function buyWithRetry(mint, amount, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
    
    try {
      // Increase slippage on retries
      const slippage = TRADE_CONFIG.slippage + (attempt - 1) * 2;
      const result = await buyTokens(mint, amount, slippage, TRADE_CONFIG.priorityFee);
      
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
 * Validate trade parameters
 */
function validateParams(mint, amount, slippage, priorityFee) {
  if (!mint || mint === 'TOKEN_MINT_ADDRESS_HERE') {
    throw new Error('Please provide a valid token mint address');
  }
  
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('Please provide your private key');
  }
  
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
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
    validateParams(TOKEN_MINT, TRADE_CONFIG.amount, TRADE_CONFIG.slippage, TRADE_CONFIG.priorityFee);
    
    console.log('🚀 Starting VORTENA Buy Trade Example');
    console.log('=====================================');
    
    // Execute trade with retry logic
    const result = await buyWithRetry(TOKEN_MINT, TRADE_CONFIG.amount);
    
    if (result) {
      console.log('\n🎉 Trade completed successfully!');
    } else {
      console.log('\n💥 Trade failed after all retries');
    }
    
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    console.log('\n📝 Please check your configuration:');
    console.log('1. Set your private key in PRIVATE_KEY variable');
    console.log('2. Set the token mint address in TOKEN_MINT variable');
    console.log('3. Adjust trading parameters in TRADE_CONFIG if needed');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { buyTokens, buyWithRetry }; 