# ⚠️ REVIEW BEFORE RUNNING - Transaction Generation Scripts

## 📋 Summary

I've created 3 scripts for generating transaction volume on your Grass.fun platform:

1. **`generate-transactions-terminal2.js`** - Main script that plays real games
2. **`collect-funds-terminal2.js`** - Collects leftover funds from test wallets
3. **`count-transactions.js`** - Counts on-chain transactions

## 🎮 What These Scripts Do

### Main Script (`generate-transactions-terminal2.js`)
- Creates **3 random wallets**
- Funds each with **0.25 MNT** (total: 0.75 MNT)
- Plays **60 real games** from your platform:
  - **Coinflip** (50% win rate, 1.95x)
  - **Mines** (40-60% win rate, 1.5x-24x)
  - **Crash** (30-50% win rate, 1.1x-10x)
  - **Paaji** (45-65% win rate, 1.2x-5x)
- Each game = 2 transactions (startGame + resolveGame via API)
- **Total: 120 transactions**
- Uses weighted random wallet selection
- Bet amount: **0.01 MNT per game** (minimum)

### Cost
- **~0.95 MNT total** (0.75 for funding + 0.2 for gas)
- Uses **REAL MNT on MAINNET**
- **Optimized for 1.2 MNT budget**

## ⚙️ Configuration to Review

### In `generate-transactions-terminal2.js`:

```javascript
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "http://localhost:3000/api/resolve-game-production";
const NUMBER_OF_WALLETS = 3;
const TOTAL_GAMES = 60;
const FUNDING_PER_WALLET = "0.25";
const BET_AMOUNT = "0.01"; // Minimum bet amount
const DELAY_BETWEEN_TRANSACTIONS = 1500;
```

### Required Environment Variables:

1. **`.env` file in root:**
```env
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x61d11C622Bd98A71aD9361833379A2066Ad29CCa
RESOLVER_API_URL=http://localhost:3000/api/resolve-game-production
```

2. **Resolver API must be running:**
   - Your Next.js app must be running on port 3000
   - The `/api/resolve-game-production` endpoint must be accessible
   - The PRIVATE_KEY in `.env` must match the resolver account

## ✅ Pre-Flight Checklist

Before running, verify:

- [ ] Contract address is correct (currently: `0x61d11C622Bd98A71aD9361833379A2066Ad29CCa`)
- [ ] Resolver API URL is correct (default: `http://localhost:3000/api/resolve-game-production`)
- [ ] PRIVATE_KEY in `.env` matches the resolver account on the contract
- [ ] You have at least **1.0 MNT** in your main wallet (optimized for 1.2 MNT budget)
- [ ] Next.js app is running (for resolver API)
- [ ] Network is set to **MNT Mainnet** (not testnet)
- [ ] You've reviewed the script configuration

## 🚀 How to Run

1. **Install axios (if not already installed):**
```bash
npm install
```

2. **Start your Next.js app (for resolver API):**
```bash
npm run dev
```

3. **In a separate terminal, run the script:**
```bash
npm run generate:transactions
# OR
npx hardhat run scripts/generate-transactions-terminal2.cjs --network celo
```

4. **After completion, collect leftover funds:**
```bash
npm run collect:funds
```

5. **Count transactions:**
```bash
npm run count:transactions
```

## 🔍 What to Monitor

- Script will show progress every game
- Wallet distribution shown every 50 games
- All transaction hashes are logged
- Final summary shows total spent and transactions

## ⚠️ Important Notes

1. **These scripts use REAL MNT on MAINNET**
2. **Generated wallet files contain private keys** - they're in `.gitignore` but be careful
3. **Scripts will create actual on-chain transactions**
4. **Resolver API must be accessible** - games won't resolve without it
5. **Each game requires 2 transactions** (start + resolve)

## 🛑 To Stop

Press `Ctrl+C` - the script will stop gracefully. You can collect funds later.

## 📝 Files Created

- `scripts/generate-transactions-terminal2.cjs` - Main transaction generator
- `scripts/collect-funds-terminal2.cjs` - Fund collection
- `scripts/count-transactions.cjs` - Transaction counter
- `scripts/README.md` - Full documentation
- `scripts/generated-wallets-terminal2.json` - Generated wallets (created when run)

## 🔐 Security

- Wallet files are in `.gitignore`
- Private keys are stored locally only
- Scripts use environment variables for sensitive data

---

## ✅ Ready to Run?

**Please review:**
1. Contract address is correct
2. Resolver API URL is correct
3. PRIVATE_KEY matches resolver account
4. You have sufficient MNT balance
5. Next.js app is running

**Then confirm you want to proceed!**

