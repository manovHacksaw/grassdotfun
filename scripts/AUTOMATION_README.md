# 🎮 Game Automation Scripts for Mantle Sepolia

This directory contains automation scripts for testing and simulating game activity on the Mantle Sepolia testnet.

## Available Scripts

### 1. Single Wallet Automation
**Script:** `automate-games.cjs`
**Command:** `npm run automate:single`

Plays games continuously with a single wallet.

**Configuration:**
- `GAMES_TO_PLAY`: Number of games to play (0 = infinite)
- `BET_AMOUNT`: Bet amount in MNT (default: 0.01)
- `WIN_PROBABILITY`: Chance of winning (default: 55%)
- `MIN_MULTIPLIER`: Minimum win multiplier (default: 1.5x)
- `MAX_MULTIPLIER`: Maximum win multiplier (default: 2.5x)
- `DELAY_BETWEEN_GAMES`: Delay in ms between games (default: 3000)

**Example:**
```bash
npm run automate:single
```

### 2. Multi-Wallet Automation
**Script:** `automate-multi-wallet.cjs`
**Command:** `npm run automate:multi`

Creates multiple wallets, funds them, and plays games with each wallet.

**Configuration:**
- `NUMBER_OF_WALLETS`: Number of wallets to create (default: 10)
- `GAMES_PER_WALLET`: Games each wallet plays (default: 5)
- `FUNDING_PER_WALLET`: MNT to fund each wallet (default: 0.15)
- `BET_AMOUNT`: Bet amount in MNT (default: 0.01)

**Features:**
- Automatically creates and funds wallets
- Saves wallet data to `auto-wallets.json`
- Re-uses existing wallets if file exists
- Auto-refunds wallets if balance drops too low

**Example:**
```bash
npm run automate:multi
```

### 3. Unified Transaction Generator
**Script:** `generate-transactions-unified.cjs`
**Command:** `npm run automate:unified`

Large-scale automation with 22 wallets playing 300+ games.

**Configuration:**
- `NUMBER_OF_WALLETS`: 22
- `TOTAL_GAMES`: 300
- `FUNDING_PER_WALLET`: 0.20 MNT
- `BET_AMOUNT`: 0.01 MNT

**Example:**
```bash
npm run automate:unified
```

### 4. Test Single Game
**Script:** `test-single-game.cjs`
**Command:** `npm run test:single-game`

Tests a complete game cycle: start → resolve → verify.

**Example:**
```bash
npm run test:single-game
```

## Prerequisites

1. **Funded Wallet**: Ensure your wallet has MNT on Mantle Sepolia testnet
2. **Resolver API**: Make sure the Next.js dev server is running for game resolution
3. **Environment Variables**: Set `PRIVATE_KEY` in `.env.local`

## Getting MNT Test Tokens

Visit the Mantle Sepolia faucet to get test MNT:
- [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)

## Running Automation

### Step 1: Start the Resolver API
```bash
npm run dev
```

### Step 2: Run Automation (in a new terminal)
```bash
# Single wallet automation
npm run automate:single

# Multi-wallet automation
npm run automate:multi

# Large-scale automation
npm run automate:unified
```

## Monitoring

### View Contract Stats
```bash
npm run test:contract
```

### Check Wallet Balances
```bash
npm run check:balances
```

### Count Transactions
```bash
npm run count:transactions
```

## Configuration Tips

### For Testing (Low Volume)
```javascript
GAMES_TO_PLAY: 10
BET_AMOUNT: "0.01"
DELAY_BETWEEN_GAMES: 5000
```

### For Demo (Medium Volume)
```javascript
GAMES_TO_PLAY: 50
BET_AMOUNT: "0.01"
DELAY_BETWEEN_GAMES: 2000
```

### For Stress Testing (High Volume)
```javascript
NUMBER_OF_WALLETS: 20
GAMES_PER_WALLET: 10
DELAY_BETWEEN_GAMES: 1000
```

## Safety Features

- ✅ Balance checking before each game
- ✅ Automatic wallet refunding
- ✅ Error handling and retry logic
- ✅ Progress tracking and reporting
- ✅ Graceful shutdown on low balance

## Troubleshooting

### "Insufficient balance" error
- Fund your main wallet with more MNT
- Reduce `BET_AMOUNT` or `NUMBER_OF_WALLETS`

### "Connection refused" error
- Ensure Next.js dev server is running (`npm run dev`)
- Check `RESOLVER_API_URL` in script configuration

### "Transaction failed" error
- Check gas price on Mantle Sepolia
- Verify contract address is correct
- Ensure resolver account matches deployed contract

## Game Types

Available game types for automation:
- `coinflip` - Coin flip game
- `mines` - Mines game
- `rugs` - Cash out game
- `paaji` - Paaji On Top game

## Output Files

- `auto-wallets.json` - Multi-wallet automation data
- `generated-wallets-unified.json` - Unified generator data
- Terminal logs with real-time progress

## Support

For issues or questions:
1. Check contract on [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz/address/0x61d11C622Bd98A71aD9361833379A2066Ad29CCa)
2. Verify RPC connection
3. Check resolver API logs

## Notes

- All scripts use the deployed contract on Mantle Sepolia
- Game outcomes are randomized but configurable
- Scripts automatically handle gas estimation
- Progress is saved periodically

Happy testing! 🎮🚀
