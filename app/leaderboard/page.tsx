"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { useReadContract } from "wagmi"
import SecureGamesABI from "../../contract/abi.json"
import { formatEther } from "viem"
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Award,
  Target,
  DollarSign,
  Gamepad2,
  Calendar,
  Clock,
  BarChart3,
  Filter,
  Search
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

interface ProcessedLeaderboardUser {
  address: string
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
  rank: number
}

type SortBy = 'totalWon' | 'netProfit' | 'winRate' | 'gamesPlayed' | 'totalBet'

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#4A90E2', '#50C878']

export default function LeaderboardPage() {
  const { address, isConnected } = useWagmiWallet()
  const [leaderboard, setLeaderboard] = useState<ProcessedLeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [sortBy, setSortBy] = useState<SortBy>('totalWon')
  const [searchTerm, setSearchTerm] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Get all users from contract
  const { 
    data: allUsers, 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SecureGamesABI,
    functionName: 'getAllUsers',
    query: {
      enabled: true,
      refetchInterval: 60000, // Refetch every minute
    }
  })

  // Fetch user stats for all users
  const fetchUserStats = async (userAddresses: string[]) => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log("🏆 Fetching leaderboard data for", userAddresses.length, "users...")
      
      const userStatsPromises = userAddresses.map(async (userAddress) => {
        try {
          // We'll need to make individual contract calls for each user
          // For now, let's create a mock implementation that we can replace with real contract calls
          const mockStats: ProcessedLeaderboardUser = {
            address: userAddress,
            totalBet: Math.random() * 100,
            totalWon: Math.random() * 120,
            totalLost: Math.random() * 80,
            withdrawableBalance: Math.random() * 20,
            gamesPlayed: Math.floor(Math.random() * 100) + 1,
            gamesWon: Math.floor(Math.random() * 50) + 1,
            winRate: Math.random() * 100,
            netProfit: Math.random() * 40 - 20,
            joinDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            lastPlayDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            joinBlock: Math.floor(Math.random() * 1000000),
            lastPlayBlock: Math.floor(Math.random() * 1000000),
            rank: 0
          }
          
          // Calculate win rate
          mockStats.winRate = mockStats.gamesPlayed > 0 ? (mockStats.gamesWon / mockStats.gamesPlayed) * 100 : 0
          mockStats.netProfit = mockStats.totalWon - mockStats.totalLost
          
          return mockStats
        } catch (error) {
          console.warn(`⚠️ Failed to fetch stats for ${userAddress}:`, error)
          return null
        }
      })
      
      const userStatsResults = await Promise.all(userStatsPromises)
      const validUsers = userStatsResults.filter((user): user is ProcessedLeaderboardUser => user !== null)
      
      // Sort users based on selected criteria
      const sortedUsers = validUsers.sort((a, b) => {
        switch (sortBy) {
          case 'totalWon':
            return b.totalWon - a.totalWon
          case 'netProfit':
            return b.netProfit - a.netProfit
          case 'winRate':
            return b.winRate - a.winRate
          case 'gamesPlayed':
            return b.gamesPlayed - a.gamesPlayed
          case 'totalBet':
            return b.totalBet - a.totalBet
          default:
            return b.totalWon - a.totalWon
        }
      }).map((user, index) => ({ ...user, rank: index + 1 }))
      
      setLeaderboard(sortedUsers)
      setLastRefresh(new Date())
      console.log("🏆 Leaderboard updated with", sortedUsers.length, "users")
      
    } catch (error: any) {
      console.error("❌ Failed to fetch leaderboard:", error)
      setError(error.message || "Failed to fetch leaderboard data")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch leaderboard when users data changes
  useEffect(() => {
    if (allUsers && Array.isArray(allUsers)) {
      const userAddresses = allUsers.map(addr => addr.toLowerCase())
      fetchUserStats(userAddresses)
    }
  }, [allUsers, sortBy])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetchUsers()
    } catch (err) {
      setError("Failed to refresh leaderboard")
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-white/60 font-bold">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30"
    if (rank === 2) return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300/30"
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/30"
    return "bg-background/60 border-border"
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const filteredLeaderboard = leaderboard.filter(user => 
    user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatAddress(user.address).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Generate chart data for top performers
  const topPerformersData = leaderboard.slice(0, 10).map(user => ({
    name: formatAddress(user.address),
    totalWon: user.totalWon,
    netProfit: user.netProfit,
    winRate: user.winRate,
    gamesPlayed: user.gamesPlayed
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-white/70">
              Top performers and gaming statistics
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
              disabled={isLoading || usersLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || usersLoading) ? 'animate-spin' : ''}`} />
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
        {(isLoading || usersLoading) && leaderboard.length === 0 && (
          <Card className="bg-background/60 border-border p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70">Loading leaderboard...</p>
          </Card>
        )}

        {/* Controls */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Search */}
            <Card className="bg-background/60 border-border p-4">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Search by address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white placeholder-white/50 border-none outline-none flex-1"
                />
              </div>
            </Card>

            {/* Sort Options */}
            <Card className="bg-background/60 border-border p-4">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-green-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent text-white border-none outline-none flex-1"
                >
                  <option value="totalWon">Total Won</option>
                  <option value="netProfit">Net Profit</option>
                  <option value="winRate">Win Rate</option>
                  <option value="gamesPlayed">Games Played</option>
                  <option value="totalBet">Total Bet</option>
                </select>
              </div>
            </Card>

            {/* Stats Summary */}
            <Card className="bg-background/60 border-border p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-white/70 text-sm">Total Players</p>
                  <p className="text-white font-bold">{leaderboard.length}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-background/60 border-border p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-white/70 text-sm">Top Winner</p>
                  <p className="text-white font-bold">
                    {leaderboard[0] ? formatAddress(leaderboard[0].address) : "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Top Performers Chart */}
        {leaderboard.length > 0 && (
          <Card className="bg-background/60 border-border p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-semibold text-white">Top 10 Performers</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="totalWon" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Leaderboard Table */}
        {leaderboard.length > 0 && (
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h3 className="text-xl font-semibold text-white">Player Rankings</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Player</th>
                    <th className="text-right py-3 px-4 text-white/70 font-medium">Total Won</th>
                    <th className="text-right py-3 px-4 text-white/70 font-medium">Net Profit</th>
                    <th className="text-right py-3 px-4 text-white/70 font-medium">Win Rate</th>
                    <th className="text-right py-3 px-4 text-white/70 font-medium">Games</th>
                    <th className="text-right py-3 px-4 text-white/70 font-medium">Last Play</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((user) => (
                    <tr 
                      key={user.address}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getRankColor(user.rank)}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(user.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {user.address.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{formatAddress(user.address)}</p>
                            {user.address.toLowerCase() === address?.toLowerCase() && (
                              <span className="text-blue-400 text-xs">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-green-400 font-medium">{user.totalWon.toFixed(4)} U2U</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-medium ${user.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {user.netProfit >= 0 ? '+' : ''}{user.netProfit.toFixed(4)} U2U
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-white font-medium">{user.winRate.toFixed(1)}%</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-white font-medium">{user.gamesPlayed}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-white/70 text-sm">{user.lastPlayDate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLeaderboard.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <p className="text-white/50">No players found matching "{searchTerm}"</p>
              </div>
            )}
          </Card>
        )}

        {/* No Data State */}
        {!isLoading && !usersLoading && leaderboard.length === 0 && !error && (
          <Card className="bg-background/60 border-border p-8 text-center">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Players Yet</h3>
            <p className="text-white/70">
              Be the first to play and appear on the leaderboard!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}