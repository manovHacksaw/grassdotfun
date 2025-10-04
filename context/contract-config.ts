import { ContractConfig, NetworkConfig } from './types';

// Contract ABI - Generated from SecureGames.sol
export const SECURE_GAMES_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "gameType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockHeight",
        "type": "uint256"
      }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "didWin",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winnings",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "multiplierPercent",
        "type": "uint256"
      }
    ],
    "name": "GameResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  
  // Functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_resolverAccountId",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "receive",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "gameType",
        "type": "string"
      }
    ],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "didWin",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "multiplierPercent",
        "type": "uint256"
      }
    ],
    "name": "resolveGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "accountId",
        "type": "address"
      }
    ],
    "name": "getUserStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalBet",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalLost",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "withdrawableBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "gamesPlayed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "gamesWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "joinBlock",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastPlayBlock",
            "type": "uint256"
          }
        ],
        "internalType": "struct SecureGames.UserStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "accountId",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "gameType",
        "type": "string"
      }
    ],
    "name": "getUserGameStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "gameType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalBets",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalLost",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "gamesPlayed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "gamesWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "bestMultiplierPercent",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalMultiplierPercent",
            "type": "uint256"
          }
        ],
        "internalType": "struct SecureGames.GameTypeStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      }
    ],
    "name": "getGameDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "enum SecureGames.GameStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "blockHeight",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "gameType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "multiplierPercent",
            "type": "uint256"
          }
        ],
        "internalType": "struct SecureGames.Game",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResolverAccount",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingGames",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "start",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getAllUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalUsers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalUsers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalBets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalWinnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalGames",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newResolver",
        "type": "address"
      }
    ],
    "name": "updateResolver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resolverAccountId",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract configuration
export const CONTRACT_CONFIG: ContractConfig = {
  address: "0x7769C0DCAA9316fc592f7258B3fACA2300D41caf", // Sepolia deployment
  abi: SECURE_GAMES_ABI,
  resolverAddress: "0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2"
};

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://0xrpc.io/sep",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io"
  },
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: ""
  }
};
