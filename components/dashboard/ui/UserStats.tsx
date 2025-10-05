"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// ContractService is deprecated - using wagmi hooks directly
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { useUserStats, useContractStats, useWagmiContractService } from "@/lib/wagmiContractService"
import { formatU2U } from "@/lib/currencyUtils"
import { useLiveConversion } from "@/lib/useCurrencyRates"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, DollarSign, Gamepad2, Trophy, Target, Calendar, RefreshCw } from "lucide-react"
import Leaderboard from "./Leaderboard"

interface GameStats {
  gameType: string
  totalBets: number
  totalWon: number
  totalLost: number
  winRate: number
  avgMultiplier: number
  bestMultiplier: number
  totalGames: number
  gamesWon: number
}

interface UserStats {
  totalBet: string
  totalWon: string
  totalLost: string
  withdrawableBalance: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  favoriteGame: string
  joinDate: string
  lastPlayDate: string
  gameTypeStats: GameStats[]
}

// Contract data format (from U2U contract)
interface ContractUserStats {
  totalBet: string | bigint
  totalWon: string | bigint
  totalLost: string | bigint
  withdrawableBalance: string | bigint
  gamesPlayed: number
  gamesWon: number
  joinDate: string | bigint
  lastPlayDate: string | bigint
}

interface ChartData {
  date: string
  profit: number
  bets: number
  multiplier: number
}

interface GameDistribution {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for recharts compatibility
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function UserStats() {
  const { address, isConnected, balance, isBalanceLoading, refreshBalance } = useWagmiWallet()

  // Use wagmi hooks for real contract data
  const contractUserStats = useUserStats(address as `0x${string}`)
  const contractStats = useContractStats()
  const { withdraw: contractWithdraw, isPending: isWithdrawPending, error: withdrawError } = useWagmiContractService()

  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [gameDistribution, setGameDistribution] = useState<GameDistribution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const walletBalance = balance

  // Live conversion rates for main stats
  const totalBetConversion = useLiveConversion(userStats?.totalBet || "0")
  const totalWonConversion = useLiveConversion(userStats?.totalWon || "0")
  const withdrawableConversion = useLiveConversion(userStats?.withdrawableBalance || "0")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false)
  const [transactionHash, setTransactionHash] = useState<string>("")

  // This useEffect is no longer needed since we're using the contractUserStats useEffect below

  // ContractService is deprecated - using wagmi hooks directly

  // Balance is now handled by Wagmi wallet context

  // Clear messages after a delay
  const clearMessages = useCallback(() => {
    setErrorMessage("")
    setSuccessMessage("")
    setTransactionHash("")
  }, [])

  const refreshStats = useCallback(async () => {
    if (address) {
      // getUserStats is deprecated - using wagmi hooks
      console.log("🔄 Refreshing user stats...")
      try {
        // const contractStats = await getUserStats(address) // Deprecated - using wagmi hooks
        console.log("📊 Refreshed contract stats:", contractStats)

        if (false) {
          // Temporarily disabled - using wagmi hooks
          // This code was trying to access user stats from contract stats, which is incorrect
          // User stats are now handled by the contractUserStats useEffect
        }
      } catch (error) {
        console.error("❌ Failed to refresh stats:", error)
      }
    }
  }, [address, contractStats])
  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (address) {
      const interval = setInterval(refreshStats, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [address, refreshStats])
  // Simplified data fetching using ContractProvider
  const fetchUserStats = useCallback(async () => {
    console.log("🚀 fetchUserStats called")
    console.log("address:", address)
    // console.log("getUserStats function:", getUserStats) // Deprecated - using wagmi hooks

    if (!address) {
      console.log("❌ Cannot fetch stats - missing address")
      return
    }

    console.log("✅ Starting to fetch user stats...")
    setIsLoading(true)
    clearMessages() // Clear any existing messages

    try {
      // const contractStats = await getUserStats(address) // Deprecated - using wagmi hooks
      console.log("📊 Raw contract stats received:", contractStats)

      if (false) {
        // Temporarily disabled - using wagmi hooks for user stats
        // This code was trying to access user stats from contract stats, which is incorrect
        // User stats are now handled by the contractUserStats useEffect below
      } else {
        console.log("❌ No stats found for user")
        // Set default empty stats
        const defaultStats: UserStats = {
          totalBet: "0.00",
          totalWon: "0.00",
          totalLost: "0.00",
          withdrawableBalance: "0.00",
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteGame: "N/A",
          joinDate: "N/A",
          lastPlayDate: "N/A",
          gameTypeStats: [],
        }
        setUserStats(defaultStats)
        setGameStats([])
        setChartData([])
        setGameDistribution([])
      }
    } catch (error: any) {
      console.error("❌ Error in fetchUserStats:", error)
      setErrorMessage("Failed to fetch user statistics")

      // Set empty data on error
      const errorStats: UserStats = {
        totalBet: "0.00",
        totalWon: "0.00",
        totalLost: "0.00",
        withdrawableBalance: "0.00",
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        favoriteGame: "N/A",
        joinDate: "N/A",
        lastPlayDate: "N/A",
        gameTypeStats: [],
      }
      setUserStats(errorStats)
      setGameStats([])
      setChartData([])
      setGameDistribution([])
    } finally {
      setIsLoading(false)
      console.log("🏁 fetchUserStats completed")
    }
  }, [address, contractStats, clearMessages])

  useEffect(() => {
    console.log("🔄 Stats fetch effect triggered")
    console.log("isConnected:", isConnected)
    console.log("address:", address)
    // console.log("getUserStats:", getUserStats) // Deprecated - using wagmi hooks

    if (isConnected && address) {
      console.log("✅ Wallet is connected, fetching user stats...")
      fetchUserStats()
    } else {
      console.log("❌ Wallet not connected or missing dependencies, skipping stats fetch")
    }
  }, [isConnected, address])

  // Update user stats when contract data changes
  useEffect(() => {
    if (contractUserStats && !contractUserStats.isLoading && contractUserStats.totalBet) {
      try {
        // Use real timestamps from contract data
        const joinTimestamp = Number.parseInt(contractUserStats.joinTimestamp) || 0
        const lastPlayTimestamp = Number.parseInt(contractUserStats.lastPlayTimestamp) || 0

        // Convert timestamps to dates (multiply by 1000 to convert from seconds to milliseconds)
        const joinDate = joinTimestamp > 0 ? new Date(joinTimestamp * 1000) : new Date()
        const lastPlayDate = lastPlayTimestamp > 0 ? new Date(lastPlayTimestamp * 1000) : new Date()

        const processedStats: UserStats = {
          totalBet: Number.parseFloat(contractUserStats.totalBet).toFixed(2),
          totalWon: Number.parseFloat(contractUserStats.totalWon).toFixed(2),
          totalLost: Number.parseFloat(contractUserStats.totalLost).toFixed(2),
          withdrawableBalance: Number.parseFloat(contractUserStats.withdrawableBalance).toFixed(2),
          gamesPlayed: Number.parseInt(contractUserStats.gamesPlayed) || 0,
          gamesWon: Number.parseInt(contractUserStats.gamesWon) || 0,
          winRate: contractUserStats.winRate || 0,
          favoriteGame: "N/A",
          joinDate: joinDate.toISOString(),
          lastPlayDate: lastPlayDate.toISOString(),
          gameTypeStats: [],
        }

        console.log("📊 Processed user stats:", processedStats)
        setUserStats(processedStats)
      } catch (error) {
        console.error("Error processing user stats:", error)
      }
    }
  }, [contractUserStats])

  const formatCurrency = (amount: string) => {
    return `${formatU2U(amount)} U2U`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleWithdraw = async () => {
    if (!isConnected || !userStats) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    const withdrawableAmount = Number.parseFloat(userStats.withdrawableBalance)
    if (withdrawableAmount <= 0) {
      setErrorMessage("No winnings to withdraw")
      return
    }

    setIsLoading(true)
    clearMessages() // Clear any existing messages

    try {
      console.log("💰 Starting withdrawal process...")
      console.log(`💸 Withdrawing ${formatU2U(withdrawableAmount.toString())} U2U`)

      // Call the contract withdraw function
      const result = await contractWithdraw()
      console.log("✅ Withdrawal transaction sent:", result)

      setSuccessMessage(
        `🎉 Withdrawal transaction sent! ${formatU2U(withdrawableAmount.toString())} U2U will be sent to your wallet.`,
      )
      setTransactionHash(result || "withdrawal-sent")

      // Refresh stats and balance after successful withdrawal
      setTimeout(async () => {
        console.log("🔄 Refreshing stats and balance after withdrawal...")
        await Promise.all([refreshStats(), refreshBalance()])
      }, 3000) // Wait for the transaction to be processed
    } catch (error: any) {
      console.error("❌ Error withdrawing:", error)
      let errorMsg = "Error withdrawing winnings. Please try again."

      // Handle specific error cases
      if (error.message?.includes("Nothing to withdraw")) {
        errorMsg = "No winnings available to withdraw"
      } else if (error.message?.includes("User closed the window") || error.message?.includes("cancelled")) {
        errorMsg = "Transaction cancelled. Please try again when ready."
      } else if (error.message?.includes("insufficient balance")) {
        errorMsg = "Insufficient contract balance for withdrawal"
      } else if (error.message?.includes("Contract method is not found")) {
        errorMsg = "Contract not properly deployed. Please contact support."
      } else if (error.message?.includes("No account connected")) {
        errorMsg = "Please connect your wallet first"
      } else if (error.message?.includes("Transfer failed")) {
        errorMsg = "Transfer failed. Please try again."
      } else if (error.message?.includes("User rejected")) {
        errorMsg = "Transaction rejected. Please try again."
      } else if (error.message) {
        errorMsg = error.message
      }

      setErrorMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-8">
        <div className="text-8xl mb-6">📊</div>
        <h2 className="text-foreground text-4xl font-bold mb-4">User Statistics</h2>
        <p className="text-muted-foreground text-xl mb-8 max-w-2xl">
          Connect your wallet to view your gaming statistics and performance analytics
        </p>
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg">
          <p className="text-white/80 text-sm">
            🔗 Please connect your wallet to access your personal statistics dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl w-full h-screen pt-4 space-y-6 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1 text-balance">Your statistics</h1>
          <p className="text-muted-foreground">Track your performance and on-chain earnings</p>
        </div>
        <Button onClick={fetchUserStats} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Wallet Status */}
      <Card className="p-4 border-border bg-card/60 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">Wallet connected</p>
            {isBalanceLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 border border-emerald-300 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Loading balance...</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Balance: {walletBalance} U2U</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-400">Account</p>
            <p className="text-xs text-muted-foreground">{address?.slice(0, 12)}...</p>
          </div>
        </div>
      </Card>

      {/* Quick Withdraw Section */}
      {userStats && Number.parseFloat(userStats.withdrawableBalance) > 0 && (
        <Card className="p-6 border border-yellow-500/30 bg-card/60 hover:border-yellow-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-yellow-400 text-lg font-semibold mb-1">You have winnings to withdraw</h3>
              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-semibold text-yellow-300">{formatU2U(userStats.withdrawableBalance)} U2U</span>{" "}
                is ready to withdraw
              </p>
              <Button
                onClick={handleWithdraw}
                disabled={isLoading || isWithdrawPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-primary-foreground font-semibold h-10 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {isLoading || isWithdrawPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Withdraw {formatU2U(userStats.withdrawableBalance)} U2U</>
                )}
              </Button>
            </div>
            <Trophy className="w-10 h-10 text-yellow-400 ml-4" />
          </div>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          className={`${isNetworkError ? "bg-yellow-600/20 border-yellow-500/30" : "bg-red-600/20 border-red-500/30"} border rounded-2xl p-4`}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{isNetworkError ? "🌐" : "⚠️"}</div>
            <div>
              <p className={`${isNetworkError ? "text-yellow-400" : "text-red-400"} text-sm font-medium`}>
                {errorMessage}
              </p>
              {isNetworkError && (
                <p className="text-yellow-300 text-xs mt-1">
                  The app will automatically retry when the connection is restored.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4">
          <p className="text-green-400 text-sm font-medium">✅ {successMessage}</p>
        </div>
      )}

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-blue-400 text-xs font-medium">🔗 TX: {transactionHash.slice(0, 12)}...</p>
          <a
            href={`https://explorer.testnet.near.org/transactions/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 text-xs underline"
          >
            View on Explorer
          </a>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bet</p>
              <p className="text-2xl font-bold text-white" title={totalBetConversion.conversionText}>
                {formatCurrency(userStats?.totalBet || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBetConversion.isLoading ? "Loading..." : totalBetConversion.conversionText}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Won</p>
              <p className="text-2xl font-bold text-green-500" title={totalWonConversion.conversionText}>
                {formatCurrency(userStats?.totalWon || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalWonConversion.isLoading ? "Loading..." : totalWonConversion.conversionText}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-white">{userStats?.winRate || 0}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Games Played</p>
              <p className="text-2xl font-bold text-white">{userStats?.gamesPlayed || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{userStats?.gamesWon || 0} wins</p>
            </div>
            <Gamepad2 className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Profit/Loss</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }
                  formatter={(value: number) => [`${formatU2U(value.toString())} U2U`, "Profit/Loss"]}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <p className="text-4xl mb-2">📊</p>
                <p className="text-sm text-muted-foreground">No historical data available</p>
                <p className="text-xs text-muted-foreground/70">Play some games to see your performance</p>
              </div>
            </div>
          )}
        </Card>

        {/* Game Distribution */}
        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <h3 className="text-lg font-semibold text-white mb-4">Game Distribution</h3>
          {gameDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gameDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  // @ts-ignore - recharts typing
                  formatter={(value: number) => [`${value}%`, "Games"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <p className="text-4xl mb-2">🎮</p>
                <p className="text-sm text-muted-foreground">No game data available</p>
                <p className="text-xs text-muted-foreground/70">Play different games to see distribution</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Game Performance Table */}
      <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
        <h3 className="text-lg font-semibold text-white mb-4">Game Performance</h3>
        {gameStats.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Game</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Games Played</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Win Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Won</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Best Multiplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {gameStats.map((game, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{game.gameType}</td>
                    <td className="py-3 px-4 text-white">{game.totalGames}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`${
                          game.winRate >= 60
                            ? "bg-green-500/20 text-green-400"
                            : game.winRate >= 40
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        } px-2 py-1 rounded-full text-xs font-medium`}
                      >
                        {game.winRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-green-400 font-medium">{formatU2U(game.totalWon.toString())} U2U</td>
                    <td className="py-3 px-4 text-white">{game.bestMultiplier.toFixed(2)}×</td>
                    <td className="py-3 px-4 text-white">{game.avgMultiplier.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <p className="text-4xl mb-2">📈</p>
              <p className="text-sm text-muted-foreground">No game performance data available</p>
              <p className="text-xs text-muted-foreground/70">Play games to see your performance statistics</p>
            </div>
          </div>
        )}
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`${userStats && Number.parseFloat(userStats.withdrawableBalance) > 0 ? "bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30" : "bg-card/60 border-border"} p-6 hover:shadow-md hover:border-primary/30 transition`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Withdrawable Balance</p>
              <p
                className={`${userStats && Number.parseFloat(userStats.withdrawableBalance) > 0 ? "text-yellow-400" : "text-white"} text-2xl font-bold`}
                title={withdrawableConversion.conversionText}
              >
                {formatCurrency(userStats?.withdrawableBalance || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {withdrawableConversion.isLoading ? "Loading..." : withdrawableConversion.conversionText}
              </p>
              {userStats && Number.parseFloat(userStats.withdrawableBalance) > 0 ? (
                <div className="mt-3">
                  <Button
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className="h-10 w-full text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>💰 Withdraw {formatU2U(userStats.withdrawableBalance)} U2U</>
                    )}
                  </Button>
                  <p className="text-xs text-yellow-400/80 mt-2 text-center">
                    ✨ Withdraw your winnings instantly to your wallet
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="h-10 w-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-400">No winnings to withdraw</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Play games to earn withdrawable winnings</p>
                </div>
              )}
            </div>
            <Trophy
              className={`h-8 w-8 ${userStats && Number.parseFloat(userStats.withdrawableBalance) > 0 ? "text-yellow-400" : "text-yellow-500"}`}
            />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Favorite Game</p>
              <p className="text-2xl font-bold text-white">{userStats?.favoriteGame || "N/A"}</p>
            </div>
            <Gamepad2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-bold text-white">
                {userStats?.joinDate ? formatDate(userStats.joinDate) : "N/A"}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-card/60 border-border p-6 hover:shadow-md hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Played</p>
              <p className="text-lg font-bold text-white">
                {userStats?.lastPlayDate ? formatDate(userStats.lastPlayDate) : "N/A"}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Withdrawal Information */}
      <Card className="bg-card/60 border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Withdraw your winnings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Winnings are processed by our resolver. Use the withdraw button when available.
        </p>
        <div className="rounded-xl p-4 border border-blue-500/30 bg-blue-500/10">
          <h4 className="font-medium text-blue-300 mb-2">How it works</h4>
          <ul className="text-sm text-blue-200/90 space-y-1">
            <li>• Play and win; totals are tracked on-chain</li>
            <li>• Automated resolver processes outcomes</li>
            <li>• Withdraw any time from your dashboard</li>
            <li>• All transactions are transparent</li>
          </ul>
        </div>
      </Card>

      {/* Leaderboard Section */}
      <div className="mt-8">
        <Leaderboard />
      </div>
    </div>
  )
}
