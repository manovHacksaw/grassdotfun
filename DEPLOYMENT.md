# U2U Solaris Mainnet Deployment Guide

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory with:
   ```env
   PRIVATE_KEY=your_private_key_here
   U2U_API_KEY=your_u2u_explorer_api_key_here
   ```

## U2U Solaris Mainnet Configuration

- **Network Name:** U2U Solaris Mainnet
- **Chain ID:** 39 (0x27)
- **RPC URL:** https://rpc-mainnet.u2u.xyz
- **Explorer:** https://u2uscan.xyz/
- **Currency:** U2U (18 decimals)

## Deployment Steps

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Run Tests (Optional)
```bash
npm run test
```

### 3. Deploy to U2U Solaris Mainnet
```bash
npm run deploy:u2u
```

### 4. Verify Contract (Optional)
```bash
npm run verify:u2u <CONTRACT_ADDRESS>
```

## Contract Details

### SecureGames Contract
- **Purpose:** EVM-compatible version of the NEAR SecureGames contract
- **Features:**
  - Game management (start/resolve)
  - User statistics tracking
  - Withdrawal system
  - Access control (owner/resolver)
  - Reentrancy protection

### Key Functions
- `startGame(gameId, gameType)` - Start a new game (payable)
- `resolveGame(gameId, didWin, multiplierPercent)` - Resolve game outcome (resolver only)
- `withdraw()` - Withdraw winnings
- `getUserStats(address)` - Get user statistics
- `getGameDetails(gameId)` - Get game information

### Events
- `GameStarted` - Emitted when a game starts
- `GameResolved` - Emitted when a game is resolved
- `Withdrawn` - Emitted when user withdraws
- `ResolverChanged` - Emitted when resolver is changed

## Security Features

1. **Reentrancy Protection** - Prevents reentrancy attacks
2. **Access Control** - Only owner can change resolver, only resolver can resolve games
3. **Input Validation** - Validates game IDs and amounts
4. **Safe Transfers** - Uses low-level call for withdrawals

## Integration with Frontend

After deployment, update your frontend configuration:

1. **Update Contract Address** in your frontend code
2. **Update ABI** if needed
3. **Test Integration** with the deployed contract

## Troubleshooting

### Common Issues

1. **Insufficient Gas** - Ensure you have enough U2U for gas fees
2. **Wrong Network** - Verify you're connected to U2U Solaris Mainnet (Chain ID: 39)
3. **Private Key Issues** - Ensure your private key is correctly set in .env

### Getting U2U Tokens

You'll need U2U tokens for:
- Gas fees for deployment
- Gas fees for contract interactions
- Testing the contract functionality

## Post-Deployment

1. **Save Deployment Info** - The deployment script saves info to `deployment-info.json`
2. **Update Frontend** - Use the deployed contract address in your frontend
3. **Set Resolver** - Configure the resolver address for game resolution
4. **Test Integration** - Verify all functionality works with the deployed contract

## Contract Verification

To verify your contract on U2UScan:
```bash
npm run verify:u2u <CONTRACT_ADDRESS>
```

This will make your contract source code visible on the explorer.
