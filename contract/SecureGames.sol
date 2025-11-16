// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title SecureGames - Solidity contract for CELO gaming platform
/// @notice Players deposit to start games. A trusted resolver resolves outcomes; winnings are credited and withdrawn by players.
/// @dev Includes event emits, per-user & per-game stats, and reentrancy protection.
contract SecureGames {
    // --------------------
    // Events
    // --------------------
    event GameStarted(bytes32 indexed gameHash, string gameId, address indexed player, uint256 amount, string gameType, uint256 blockNumber);
    event GameResolved(bytes32 indexed gameHash, string gameId, address indexed player, bool didWin, uint256 multiplierPercent, uint256 winnings, uint256 blockNumber);
    event Withdrawn(address indexed player, uint256 amount);
    event ResolverChanged(address indexed oldResolver, address indexed newResolver);
    event UserRegistered(address indexed user, uint256 blockNumber, uint256 timestamp); // UPDATED

    // --------------------
    // Enums & Structs
    // --------------------
    enum GameStatus { Pending, Won, Lost }

    struct UserStats {
        uint256 totalBet;
        uint256 totalWon;
        uint256 totalLost;
        uint256 withdrawableBalance;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 joinBlock;
        uint256 joinTimestamp; // NEW
        uint256 lastPlayBlock;
        uint256 lastPlayTimestamp;
    }

    struct GameTypeStats {
        string gameType;
        uint256 totalBets;
        uint256 totalWon;
        uint256 totalLost;
        uint256 timestamp;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 bestMultiplierPercent;
        uint256 totalMultiplierPercent;
    }

    struct Game {
        string id;
        address player;
        uint256 amount;
        GameStatus status;
        uint256 blockNumber;
        string gameType;
        uint256 multiplierPercent;
        bool exists;
    }

    // --------------------
    // State
    // --------------------
    address public owner;
    address public resolver;

    mapping(bytes32 => Game) private games;
    mapping(bytes32 => bool) private gameExists;
    bytes32[] private pendingGameHashes;
    mapping(bytes32 => uint256) private pendingIndex;

    mapping(address => UserStats) private users;
    address[] private userList;
    mapping(address => bool) private userExists;

    mapping(bytes32 => GameTypeStats) private userGameStats;
    mapping(address => string[]) private userGameTypes;
    mapping(address => mapping(string => bool)) private userHasGameType;

    uint256 private unlocked = 1;
    modifier nonReentrant() {
        require(unlocked == 1, "Reentrant");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "Only resolver");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // --------------------
    // Constructor
    // --------------------
    constructor(address _resolver) {
        require(_resolver != address(0), "resolver required");
        owner = msg.sender;
        resolver = _resolver;
        emit ResolverChanged(address(0), _resolver);
    }

    function setResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "invalid resolver");
        address old = resolver;
        resolver = _resolver;
        emit ResolverChanged(old, _resolver);
    }

    // --------------------
    // Game Logic
    // --------------------
    function startGame(string calldata gameId, string calldata gameType) external payable {
        require(bytes(gameId).length > 0, "gameId required");
        require(msg.value > 0, "Attach ETH to play");

        bytes32 h = keccak256(abi.encodePacked(gameId));
        require(!gameExists[h], "gameId already exists");

        Game memory g;
        g.id = gameId;
        g.player = msg.sender;
        g.amount = msg.value;
        g.status = GameStatus.Pending;
        g.blockNumber = block.number;
        g.gameType = bytes(gameType).length == 0 ? "unknown" : gameType;
        g.multiplierPercent = 100;
        g.exists = true;

        games[h] = g;
        gameExists[h] = true;

        pendingGameHashes.push(h);
        pendingIndex[h] = pendingGameHashes.length;

        if (!userExists[msg.sender]) {
            userExists[msg.sender] = true;
            userList.push(msg.sender);
            users[msg.sender].joinBlock = block.number;
            users[msg.sender].joinTimestamp = block.timestamp; // NEW
            emit UserRegistered(msg.sender, block.number, block.timestamp); // UPDATED
        }

        users[msg.sender].lastPlayBlock = block.number;
        users[msg.sender].lastPlayTimestamp = block.timestamp;

        emit GameStarted(h, gameId, msg.sender, msg.value, g.gameType, block.number);
    }

    function resolveGame(string calldata gameId, bool didWin, uint256 multiplierPercent) external onlyResolver {
        require(bytes(gameId).length > 0, "gameId required");
        bytes32 h = keccak256(abi.encodePacked(gameId));
        require(gameExists[h], "Game not found");

        Game storage g = games[h];
        require(g.exists, "Game not exists");
        require(g.status == GameStatus.Pending, "Game already resolved");

        uint256 mult = multiplierPercent;
        g.multiplierPercent = mult;

        address player = g.player;
        string memory gtype = bytes(g.gameType).length == 0 ? "unknown" : g.gameType;

        users[player].totalBet += g.amount;
        users[player].gamesPlayed += 1;

        bytes32 gtsKey = keccak256(abi.encodePacked(player, gtype));
        GameTypeStats storage gts = userGameStats[gtsKey];
        if (bytes(gts.gameType).length == 0) gts.gameType = gtype;
        gts.totalBets += g.amount;
        gts.gamesPlayed += 1;
        gts.totalMultiplierPercent += mult;
        if (mult > gts.bestMultiplierPercent) gts.bestMultiplierPercent = mult;
        gts.timestamp = block.timestamp;

        uint256 winnings = 0;

        if (didWin) {
            winnings = (g.amount * mult) / 100;
            users[player].totalWon += winnings;
            users[player].withdrawableBalance += winnings;
            users[player].gamesWon += 1;

            gts.totalWon += winnings;
            gts.gamesWon += 1;

            g.status = GameStatus.Won;
            emit GameResolved(h, g.id, player, true, mult, winnings, block.number);
        } else {
            users[player].totalLost += g.amount;
            gts.totalLost += g.amount;
            g.status = GameStatus.Lost;
            emit GameResolved(h, g.id, player, false, mult, 0, block.number);
        }

        if (!userHasGameType[player][gtype]) {
            userHasGameType[player][gtype] = true;
            userGameTypes[player].push(gtype);
        }

        uint256 idx = pendingIndex[h];
        if (idx != 0) {
            uint256 lastIdx = pendingGameHashes.length;
            bytes32 lastHash = pendingGameHashes[lastIdx - 1];
            if (idx != lastIdx) {
                pendingGameHashes[idx - 1] = lastHash;
                pendingIndex[lastHash] = idx;
            }
            pendingGameHashes.pop();
            pendingIndex[h] = 0;
        }
    }

    function withdraw() external nonReentrant {
        uint256 amount = users[msg.sender].withdrawableBalance;
        require(amount > 0, "Nothing to withdraw");
        users[msg.sender].withdrawableBalance = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    // --------------------
    // Views
    // --------------------
    function getUserStats(address account)
        external
        view
        returns (
            uint256 totalBet,
            uint256 totalWon,
            uint256 totalLost,
            uint256 withdrawableBalance,
            uint256 gamesPlayed,
            uint256 gamesWon,
            uint256 joinBlock,
            uint256 joinTimestamp, // NEW
            uint256 lastPlayBlock,
            uint256 lastPlayTimestamp
        )
    {
        UserStats storage u = users[account];
        return (
            u.totalBet,
            u.totalWon,
            u.totalLost,
            u.withdrawableBalance,
            u.gamesPlayed,
            u.gamesWon,
            u.joinBlock,
            u.joinTimestamp, 
            u.lastPlayBlock,
            u.lastPlayTimestamp
        );
    }

    function getUserGameStats(address account) external view returns (GameTypeStats[] memory) {
        string[] storage types = userGameTypes[account];
        GameTypeStats[] memory out = new GameTypeStats[](types.length);
        for (uint256 i = 0; i < types.length; i++) {
            bytes32 k = keccak256(abi.encodePacked(account, types[i]));
            out[i] = userGameStats[k];
        }
        return out;
    }

    function getGameDetails(string calldata gameId)
        external
        view
        returns (
            string memory id,
            address player,
            uint256 amount,
            GameStatus status,
            uint256 blockNumber,
            string memory gameType,
            uint256 multiplierPercent,
            bool existsFlag
        )
    {
        bytes32 h = keccak256(abi.encodePacked(gameId));
        Game storage g = games[h];
        return (g.id, g.player, g.amount, g.status, g.blockNumber, g.gameType, g.multiplierPercent, g.exists);
    }

    function getResolverAccount() external view returns (address) {
        return resolver;
    }

    function getPendingGames() external view returns (string[] memory) {
        uint256 n = pendingGameHashes.length;
        string[] memory out = new string[](n);
        for (uint256 i = 0; i < n; i++) {
            Game storage g = games[pendingGameHashes[i]];
            out[i] = g.id;
        }
        return out;
    }

    function getAllUsers() external view returns (address[] memory) {
        return userList;
    }

    function getContractStats()
        external
        view
        returns (
            uint256 totalUsers,
            uint256 totalBets,
            uint256 totalWinnings,
            uint256 totalGames
        )
    {
        uint256 tb;
        uint256 tw;
        uint256 tg;
        for (uint256 i = 0; i < userList.length; i++) {
            address a = userList[i];
            tb += users[a].totalBet;
            tw += users[a].totalWon;
            tg += users[a].gamesPlayed;
        }
        return (userList.length, tb, tw, tg);
    }

    receive() external payable {
        revert("Send with startGame only");
    }

    fallback() external payable {
        revert("Not supported");
    }
}
