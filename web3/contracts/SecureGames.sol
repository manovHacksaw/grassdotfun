// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureGames
 * @dev Gaming contract with resolver-based outcome determination and claimable winnings
 */
contract SecureGames {
    // --------------------
    // Data Structures
    // --------------------
    
    struct UserStats {
        uint256 totalBet;
        uint256 totalWon;
        uint256 totalLost;
        uint256 withdrawableBalance;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 joinBlock;
        uint256 lastPlayBlock;
    }
    
    struct GameTypeStats {
        string gameType;
        uint256 totalBets;
        uint256 totalWon;
        uint256 totalLost;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 bestMultiplierPercent;
        uint256 totalMultiplierPercent;
    }
    
    enum GameStatus {
        Pending,
        Won,
        Lost
    }
    
    struct Game {
        address player;
        uint256 amount;
        GameStatus status;
        uint256 blockHeight;
        string gameType;
        uint256 multiplierPercent;
    }
    
    // --------------------
    // State Variables
    // --------------------
    
    address public resolverAccountId;
    address public owner;
    
    // Mappings
    mapping(address => UserStats) public users;
    mapping(string => Game) public games;
    mapping(bytes32 => GameTypeStats) private userGameStats; // keccak256(abi.encodePacked(address, gameType))
    
    // Arrays for iteration
    address[] private userAddresses;
    mapping(address => bool) private userExists;
    string[] private pendingGameIds;
    mapping(string => uint256) private pendingGameIndex;
    
    // --------------------
    // Events
    // --------------------
    
    event GameStarted(
        string indexed gameId,
        address indexed player,
        uint256 amount,
        string gameType,
        uint256 blockHeight
    );
    
    event GameResolved(
        string indexed gameId,
        address indexed player,
        bool didWin,
        uint256 amount,
        uint256 winnings,
        uint256 multiplierPercent
    );
    
    event Withdrawal(
        address indexed player,
        uint256 amount
    );
    
    // --------------------
    // Modifiers
    // --------------------
    
    modifier onlyResolver() {
        require(msg.sender == resolverAccountId, "Only resolver can call this");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    // --------------------
    // Constructor
    // --------------------
    
    constructor(address _resolverAccountId) {
        require(_resolverAccountId != address(0), "Resolver address required");
        owner = msg.sender;
        resolverAccountId = _resolverAccountId;
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
    
    // --------------------
    // Internal Helper Functions
    // --------------------
    
    function makeUserGameKey(address accountId, string memory gameType) 
        private 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(accountId, "|", gameType));
    }
    
    function addPendingGame(string memory gameId) private {
        pendingGameIndex[gameId] = pendingGameIds.length;
        pendingGameIds.push(gameId);
    }
    
    function removePendingGame(string memory gameId) private {
        uint256 index = pendingGameIndex[gameId];
        uint256 lastIndex = pendingGameIds.length - 1;
        
        if (index != lastIndex) {
            string memory lastGameId = pendingGameIds[lastIndex];
            pendingGameIds[index] = lastGameId;
            pendingGameIndex[lastGameId] = index;
        }
        
        pendingGameIds.pop();
        delete pendingGameIndex[gameId];
    }
    
    function addUser(address accountId) private {
        if (!userExists[accountId]) {
            userAddresses.push(accountId);
            userExists[accountId] = true;
            users[accountId].joinBlock = block.number;
        }
    }
    
    // --------------------
    // Public Functions
    // --------------------
    
    /**
     * @dev Start a new game by sending ETH
     * @param gameId Unique identifier for the game
     * @param gameType Type/category of the game
     */
    function startGame(string memory gameId, string memory gameType) 
        external 
        payable 
    {
        require(msg.value > 0, "Attach ETH to play");
        require(bytes(gameId).length > 0, "gameId required");
        require(games[gameId].player == address(0), "gameId already exists");
        
        if (bytes(gameType).length == 0) {
            gameType = "unknown";
        }
        
        // Create game
        games[gameId] = Game({
            player: msg.sender,
            amount: msg.value,
            status: GameStatus.Pending,
            blockHeight: block.number,
            gameType: gameType,
            multiplierPercent: 100
        });
        
        addPendingGame(gameId);
        
        // Update user stats
        addUser(msg.sender);
        users[msg.sender].lastPlayBlock = block.number;
        
        emit GameStarted(gameId, msg.sender, msg.value, gameType, block.number);
    }
    
    /**
     * @dev Resolve a game outcome (only resolver can call)
     * @param gameId The game to resolve
     * @param didWin Whether the player won
     * @param multiplierPercent Winning multiplier (e.g., 150 = 1.5x). Must be >=100 if win
     */
    function resolveGame(
        string memory gameId,
        bool didWin,
        uint256 multiplierPercent
    ) 
        external 
        onlyResolver 
    {
        require(bytes(gameId).length > 0, "gameId required");
        
        Game storage game = games[gameId];
        require(game.player != address(0), "Game not found");
        require(game.status == GameStatus.Pending, "Game already resolved");
        
        if (multiplierPercent == 0) {
            multiplierPercent = 100;
        }
        require(multiplierPercent >= 0, "multiplierPercent must be >= 0");
        
        game.multiplierPercent = multiplierPercent;
        
        address player = game.player;
        string memory gameType = game.gameType;
        
        // Update user stats
        UserStats storage user = users[player];
        user.totalBet += game.amount;
        user.gamesPlayed += 1;
        
        // Update game type stats
        bytes32 statsKey = makeUserGameKey(player, gameType);
        GameTypeStats storage gts = userGameStats[statsKey];
        
        // Initialize if first time
        if (bytes(gts.gameType).length == 0) {
            gts.gameType = gameType;
        }
        
        gts.totalBets += game.amount;
        gts.gamesPlayed += 1;
        gts.totalMultiplierPercent += multiplierPercent;
        
        if (multiplierPercent > gts.bestMultiplierPercent) {
            gts.bestMultiplierPercent = multiplierPercent;
        }
        
        uint256 winnings = 0;
        
        if (didWin) {
            // Calculate winnings
            winnings = (game.amount * multiplierPercent) / 100;
            
            user.totalWon += winnings;
            user.withdrawableBalance += winnings;
            user.gamesWon += 1;
            
            gts.totalWon += winnings;
            gts.gamesWon += 1;
            
            game.status = GameStatus.Won;
        } else {
            // Lost - contract keeps the bet
            user.totalLost += game.amount;
            gts.totalLost += game.amount;
            game.status = GameStatus.Lost;
        }
        
        removePendingGame(gameId);
        
        emit GameResolved(gameId, player, didWin, game.amount, winnings, multiplierPercent);
    }
    
    /**
     * @dev Withdraw claimable winnings
     */
    function withdraw() external {
        UserStats storage user = users[msg.sender];
        uint256 amount = user.withdrawableBalance;
        
        require(amount > 0, "Nothing to withdraw");
        
        // Reset before transfer to prevent reentrancy
        user.withdrawableBalance = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    // --------------------
    // View Functions
    // --------------------
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address accountId) 
        external 
        view 
        returns (UserStats memory) 
    {
        return users[accountId];
    }
    
    /**
     * @dev Get game type statistics for a user
     * @param accountId User address
     * @param gameType Type of game
     */
    function getUserGameStats(address accountId, string memory gameType) 
        external 
        view 
        returns (GameTypeStats memory) 
    {
        bytes32 key = makeUserGameKey(accountId, gameType);
        return userGameStats[key];
    }
    
    /**
     * @dev Get game details
     */
    function getGameDetails(string memory gameId) 
        external 
        view 
        returns (Game memory) 
    {
        return games[gameId];
    }
    
    /**
     * @dev Get resolver account address
     */
    function getResolverAccount() external view returns (address) {
        return resolverAccountId;
    }
    
    /**
     * @dev Get all pending game IDs
     */
    function getPendingGames() external view returns (string[] memory) {
        return pendingGameIds;
    }
    
    /**
     * @dev Get paginated list of users
     */
    function getAllUsers(uint256 start, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 end = start + limit;
        if (end > userAddresses.length) {
            end = userAddresses.length;
        }
        
        uint256 resultLength = end > start ? end - start : 0;
        address[] memory result = new address[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = userAddresses[start + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get total number of users
     */
    function getTotalUsers() external view returns (uint256) {
        return userAddresses.length;
    }
    
    /**
     * @dev Get contract-wide statistics
     */
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
        totalUsers = userAddresses.length;
        
        for (uint256 i = 0; i < userAddresses.length; i++) {
            address userAddr = userAddresses[i];
            UserStats memory user = users[userAddr];
            totalBets += user.totalBet;
            totalWinnings += user.totalWon;
            totalGames += user.gamesPlayed;
        }
        
        return (totalUsers, totalBets, totalWinnings, totalGames);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Update resolver address (only owner)
     */
    function updateResolver(address newResolver) external onlyOwner {
        require(newResolver != address(0), "Invalid resolver address");
        resolverAccountId = newResolver;
    }
    
    /**
     * @dev Emergency withdraw by owner (only if no pending games)
     */
    function emergencyWithdraw() external onlyOwner {
        require(pendingGameIds.length == 0, "Cannot withdraw with pending games");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
    }
}