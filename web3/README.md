# SecureGames Hardhat Project

This is a Hardhat project for the SecureGames smart contract - a gaming platform with resolver-based outcome determination and claimable winnings.

## Contract Overview

The SecureGames contract provides:
- Game creation and management
- Resolver-based outcome determination
- User statistics tracking
- Withdrawable winnings system
- Emergency controls for the owner

## Project Structure

```
web3/
├── contracts/
│   └── SecureGames.sol          # Main smart contract
├── scripts/
│   ├── deploy.js                # Deployment script
│   └── interact.js              # Contract interaction script
├── test/
│   └── SecureGames.test.js      # Comprehensive test suite
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
   - Add your private key for deployment
   - Add network URLs (Infura, Alchemy, etc.)
   - Add Etherscan API key for contract verification

## Available Scripts

### Compilation
```bash
npm run compile
```

### Testing
```bash
npm run test
```

### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

### Deployment
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to mainnet
npm run deploy:mainnet
```

### Other Commands
```bash
npm run clean          # Clean artifacts
npm run coverage       # Run test coverage
npm run size           # Check contract size
```

## Contract Functions

### Core Functions
- `startGame(gameId, gameType)` - Start a new game with ETH bet
- `resolveGame(gameId, didWin, multiplierPercent)` - Resolve game outcome (resolver only)
- `withdraw()` - Withdraw claimable winnings

### View Functions
- `getUserStats(address)` - Get user statistics
- `getUserGameStats(address, gameType)` - Get game type statistics
- `getGameDetails(gameId)` - Get game information
- `getContractStats()` - Get contract-wide statistics
- `getPendingGames()` - Get all pending game IDs

### Admin Functions
- `updateResolver(address)` - Update resolver address (owner only)
- `emergencyWithdraw()` - Emergency withdrawal (owner only)

## Testing

The test suite covers:
- Contract deployment and initialization
- Game creation and management
- Game resolution (win/loss scenarios)
- Withdrawal functionality
- Statistics tracking
- Access control and security
- Edge cases and error conditions

Run tests with:
```bash
npm test
```

## Deployment

1. **Local Testing**: Use `npm run node` to start a local blockchain, then `npm run deploy:local`

2. **Testnet Deployment**: 
   - Configure your `.env` file with testnet settings
   - Run `npm run deploy:sepolia`

3. **Mainnet Deployment**:
   - Configure your `.env` file with mainnet settings
   - Run `npm run deploy:mainnet`

## Security Considerations

- The resolver address is set during deployment and can only be changed by the owner
- Games can only be resolved by the designated resolver
- Emergency withdrawal is only available when no games are pending
- All user funds are protected by the contract's logic

## Gas Optimization

The contract is compiled with optimizer enabled (200 runs) to minimize gas costs. Key optimizations include:
- Efficient data structures
- Minimal storage operations
- Optimized loops and iterations

## License

MIT
