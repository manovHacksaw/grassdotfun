"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { useReadContract } from "wagmi"
import SecureGamesABI from "../../contract/abi.json"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Gamepad2, 
  Target, 
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  User,
  Wallet
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"

const CONTRACT_ADDRESS = '0x4141fE3C1bD052dCcAb0fc54A816672447cDf14F'

interface UserStats {
  totalBet: bigint
  totalWon: bigint
  totalLost: bigint
  withdrawableBalance: bigint
  gamesPlayed: bigint
  gamesWon: bigint
  joinBlock: bigint
  joinTimestamp: bigint
  lastPlayBlock: bigint
  lastPlayTimestamp: bigint
}

interface ProcessedUserStats {
  totalBet: number
  totalWon: number
  totalLost: number
  withdrawableBalance: number
  gamesPlayed: number
  gamesWon: number
  winRate: number
  netProfit: number
  joinDate: string
  lastPlayDate: string
  joinBlock: number
  lastPlayBlock: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StatisticsPage() {
  const { address, isConnected } = useWagmiWallet()
  const [userStats, setUserStats] = useState<ProcessedUserStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use wagmi's useReadContract to call getUserStats
  const { 
    data: rawUserStats, 
    isLoading: contractLoading, 
    error: contractError,
    refetch: refetchStats
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SecureGamesABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  })

  // Process the raw contract data
  useEffect(() => {
    if (rawUserStats && Array.isArray(rawUserStats) && rawUserStats.length >= 10) {
      try {
        const [
          totalBet,
          totalWon,
          totalLost,
          withdrawableBalance,
          gamesPlayed,
          gamesWon,
          joinBlock,
          joinTimestamp,
          lastPlayBlock,
          lastPlayTimestamp
        ] = rawUserStats as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]

        const processedStats: ProcessedUserStats = {
          totalBet: parseFloat(formatEther(totalBet)),
          totalWon: parseFloat(formatEther(totalWon)),
          totalLost: parseFloat(formatEther(totalLost)),
          withdrawableBalance: parseFloat(formatEther(withdrawableBalance)),
          gamesPlayed: Number(gamesPlayed),
          gamesWon: Number(gamesWon),
          winRate: Number(gamesPlayed) > 0 ? (Number(gamesWon) / Number(gamesPlayed)) * 100 : 0,
          netProfit: parseFloat(formatEther(totalWon)) - parseFloat(formatEther(totalLost)),
          joinDate: new Date(Number(joinTimestamp) * 1000).toLocaleDateString(),
          lastPlayDate: Number(lastPlayTimestamp) > 0 ? new Date(Number(lastPlayTimestamp) * 1000).toLocaleDateString() : "Never",
          joinBlock: Number(joinBlock),
          lastPlayBlock: Number(lastPlayBlock)
        }

        setUserStats(processedStats)
        setError("")
        setLastRefresh(new Date())
      } catch (err) {
        console.error("Error processing user stats:", err)
        setError("Failed to process user statistics")
      }
    } else if (contractError) {
      setError(`Contract error: ${contractError.message}`)
    }
  }, [rawUserStats, contractError])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetchStats()
    } catch {
      setError("Failed to refresh statistics")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate sample chart data for demonstration
  const generateChartData = () => {
    if (!userStats) return []
    
    const days = 7
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toLocaleDateString(),
        gamesPlayed: Math.floor(Math.random() * 10) + 1,
        totalBets: Math.random() * 2 + 0.5,
        totalWon: Math.random() * 2.5 + 0.3,
        winRate: Math.random() * 100
      })
    }
    return data
  }

  const chartData = generateChartData()

  const gameDistributionData = [
    { name: 'Coinflip', value: 35, color: '#0088FE' },
    { name: 'Mines', value: 25, color: '#00C49F' },
    { name: 'Paaji', value: 20, color: '#FFBB28' },
    { name: 'RugsFun', value: 20, color: '#FF8042' }
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Card className="bg-background/60 border-border p-8 max-w-md mx-4">
          <div className="text-center">
            <User className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-white/70 mb-6">
              Please connect your wallet to view your gaming statistics.
            </p>
            <Button className="w-full">
              Connect Wallet
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gaming Statistics</h1>
            <p className="text-white/70">
              Your comprehensive gaming performance overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <p className="text-white/50 text-sm">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading || contractLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || contractLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </Card>
        )}

        {/* Loading State */}
        {(isLoading || contractLoading) && !userStats && (
          <Card className="bg-background/60 border-border p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70">Loading your statistics...</p>
          </Card>
        )}

        {/* No Data State */}
        {!isLoading && !contractLoading && !userStats && !error && (
          <Card className="bg-background/60 border-border p-8 text-center">
            <Gamepad2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Gaming Data Found</h3>
            <p className="text-white/70">
              Start playing games to see your statistics here!
            </p>
          </Card>
        )}

        {/* Statistics Display */}
        {userStats && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Games</p>
                    <p className="text-2xl font-bold text-white">{userStats.gamesPlayed}</p>
                  </div>
                  <Gamepad2 className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold text-white">{userStats.winRate.toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Bet</p>
                    <p className="text-2xl font-bold text-white">{userStats.totalBet.toFixed(4)} U2U</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Net Profit</p>
                    <p className={`text-2xl font-bold ${userStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {userStats.netProfit >= 0 ? '+' : ''}{userStats.netProfit.toFixed(4)} U2U
                    </p>
                  </div>
                  {userStats.netProfit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-semibold text-white">Financial Overview</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Bet:</span>
                    <span className="text-white font-medium">{userStats.totalBet.toFixed(4)} U2U</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Won:</span>
                    <span className="text-green-400 font-medium">{userStats.totalWon.toFixed(4)} U2U</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Lost:</span>
                    <span className="text-red-400 font-medium">{userStats.totalLost.toFixed(4)} U2U</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Withdrawable:</span>
                    <span className="text-blue-400 font-medium">{userStats.withdrawableBalance.toFixed(4)} U2U</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <span className="text-white/70">Net Profit:</span>
                    <span className={`font-bold ${userStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {userStats.netProfit >= 0 ? '+' : ''}{userStats.netProfit.toFixed(4)} U2U
                    </span>
                  </div>
                </div>
              </Card>

              {/* Gaming Performance */}
              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-xl font-semibold text-white">Gaming Performance</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Games Played:</span>
                    <span className="text-white font-medium">{userStats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Games Won:</span>
                    <span className="text-green-400 font-medium">{userStats.gamesWon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Games Lost:</span>
                    <span className="text-red-400 font-medium">{userStats.gamesPlayed - userStats.gamesWon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Win Rate:</span>
                    <span className="text-white font-medium">{userStats.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <span className="text-white/70">Join Date:</span>
                    <span className="text-white font-medium">{userStats.joinDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Last Play:</span>
                    <span className="text-white font-medium">{userStats.lastPlayDate}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="gamesPlayed" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Game Distribution */}
              <Card className="bg-background/60 border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PieChart className="h-6 w-6 text-green-500" />
                  <h3 className="text-xl font-semibold text-white">Game Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={gameDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gameDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Performance Trends */}
            <Card className="bg-background/60 border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-semibold text-white">Performance Trends</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalWon" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalBets" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
