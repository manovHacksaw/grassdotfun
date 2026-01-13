# Transaction Generation Scripts

These scripts are designed to generate transaction volume on the Grass.fun platform by playing real games.

## ⚠️ IMPORTANT - READ BEFORE RUNNING

1. **These scripts use REAL MNT tokens on MAINNET**
2. **Review all configuration before running**
3. **Ensure you have sufficient MNT balance**
4. **The resolver API must be running and accessible**
5. **These scripts will create actual transactions on-chain**

## Scripts

### 1. `generate-transactions-terminal2.js`
Generates randomized game transactions across multiple wallets.

**What it does:**
- Creates 10 random wallets
- Funds each wallet with 0.18 MNT
- Plays 250 games (500 transactions total: 250 starts + 250 resolves)
- Plays real games: Coinflip, Mines, Crash, Paaji
- Uses weighted random wallet selection
- Resolves games via API call

**Configuration:**
- `CONTRACT_ADDRESS`: Your deployed contract address (default: mainnet address)
- `RESOLVER_API_URL`: API endpoint for resolving games (default: localhost:3000)
- `NUMBER_OF_WALLETS`: Number of wallets to create (default: 3)
- `TOTAL_GAMES`: Total games to play (default: 60)
- `FUNDING_PER_WALLET`: MNT amount per wallet (default: 0.25)
- `BET_AMOUNT`: Bet per game (default: 0.01 - minimum)
- `DELAY_BETWEEN_TRANSACTIONS`: Delay in ms (default: 1500)

**Run:**
```bash
npm run generate:transactions
# OR
npx hardhat run scripts/generate-transactions-terminal2.cjs --network celo
```

### 2. `collect-funds-terminal2.js`
Collects leftover funds from generated test wallets.

**What it does:**
- Reads wallet files from all terminals
- Checks each wallet balance
- Sends remaining funds back to main wallet (keeps 0.01 MNT for gas)

**Run:**
```bash
npm run collect:funds
# OR
npx hardhat run scripts/collect-funds-terminal2.cjs --network celo
```

### 3. `count-transactions.js`
Counts on-chain transactions by querying blockchain events.

**What it does:**
- Queries GameStarted, GameResolved, and Withdrawn events
- Counts total transactions and unique addresses
- Shows contract balance and statistics
- Breaks down games by type

**Run:**
```bash
npm run count:transactions
# OR
npx hardhat run scripts/count-transactions.cjs --network celo
```

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set environment variables:**
Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x61d11C622Bd98A71aD9361833379A2066Ad29CCa
RESOLVER_API_URL=http://localhost:3000/api/resolve-game-production
```

3. **Ensure resolver API is running:**
The scripts need the resolver API to be accessible. Make sure your Next.js app is running:
```bash
npm run dev
```

## Game Types

The scripts play these real games from your platform:
- **coinflip**: 50% win rate, 1.95x multiplier
- **mines**: 40-60% win rate, 1.5x to 24x multiplier
- **crash**: 30-50% win rate, 1.1x to 10x multiplier
- **paaji**: 45-65% win rate, 1.2x to 5x multiplier

## Cost Estimation

For default configuration (optimized for 1.2 MNT budget):
- 3 wallets × 0.25 MNT = 0.75 MNT
- Gas fees: ~0.2 MNT
- **Total: ~0.95 MNT**
- **Requires minimum: 1.0 MNT in main wallet**

## Safety

- Scripts include retry logic for failed transactions
- Progress tracking and wallet distribution monitoring
- Automatic fund collection script available
- All transactions are logged with hashes

## Notes

- Scripts save wallet files locally (DO NOT commit to git)
- Generated wallets are stored in `generated-wallets-terminal2.json`
- Scripts use weighted random selection to distribute games evenly
- Each game requires 2 transactions: startGame + resolveGame (via API)

