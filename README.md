# VORTENA API Code Examples

This folder contains practical code examples for integrating with the VORTENA trading API. These examples demonstrate how to buy and sell tokens using different programming languages.

## Prerequisites

Before using these examples, make sure you have:

1. A Solana wallet with some SOL for trading and fees
2. Your wallet's private key (Base58 encoded)
3. The token mint address you want to trade

## API Base URL

```
https://api.vortena.xyz
```

## Examples Included

### Buy Examples
- `buy.js` - JavaScript/Node.js example
- `buy.py` - Python example
- `buy.ts` - TypeScript example

### Sell Examples
- `sell.js` - JavaScript/Node.js example
- `sell.py` - Python example
- `sell.ts` - TypeScript example

### Configuration Files
- `package.json` - Node.js dependencies and scripts
- `requirements.txt` - Python dependencies (full)
- `requirements-minimal.txt` - Python dependencies (minimal)
- `env.example` - Environment variables template

## Installation

### JavaScript/TypeScript Examples

```bash
# Install dependencies
npm install

# Or install with setup script (includes global packages)
npm run setup

# Run examples
npm run buy:js    # Run JavaScript buy example
npm run sell:js   # Run JavaScript sell example
npm run buy:ts    # Run TypeScript buy example
npm run sell:ts   # Run TypeScript sell example
```

### Python Examples

```bash
# Install minimal dependencies
pip install -r requirements-minimal.txt

# Or install full dependencies (includes optional packages)
pip install -r requirements.txt

# Run examples
python buy.py
python sell.py
```

## Usage

### Option 1: Direct Configuration (Quick Start)
1. Replace `YOUR_PRIVATE_KEY_HERE` with your actual Base58 encoded private key
2. Replace `TOKEN_MINT_ADDRESS_HERE` with the token contract address you want to trade
3. Adjust the amount, slippage, and priority fee parameters as needed

### Option 2: Environment Variables (Recommended for Production)
1. Copy `env.example` to `.env`
2. Fill in your actual values in the `.env` file
3. Modify the examples to load from environment variables

## API Endpoints

### Buy Tokens
```
GET /trade/buy/{mint}/{amount}/{slippage}/{priority_fee}/{private_key}
```

### Sell Tokens
```
GET /trade/sell/{mint}/{percentage}/{slippage}/{priority_fee}/{private_key}
```

## Parameters

- **mint**: Token mint address (contract address)
- **amount**: For buy - SOL amount to spend
- **percentage**: For sell - percentage of holdings to sell (1-100)
- **slippage**: Maximum allowed slippage in percentage (recommended: 5-15)
- **priority_fee**: Priority fee in SOL (recommended: 0.003-0.01)
- **private_key**: Your wallet's Base58 encoded private key

## Security Notes

- Never hardcode your private key in production code
- Use environment variables to store sensitive information
- Always validate parameters before making API calls
- Implement proper error handling and retry logic

## Support

For more detailed documentation, visit the main application or contact support through our community channels. 