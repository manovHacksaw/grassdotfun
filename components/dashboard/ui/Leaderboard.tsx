"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useContractStats, useAllUsers, useMultipleUserStats } from "@/lib/wagmiContractService"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { formatNEAR } from "@/lib/currencyUtils"
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Award,
  Target
} from "lucide-react"

interface LeaderboardUser {
  accountId: string
  totalBet: string | bigint
  totalWon: string | bigint
  totalLost: string | bigint
  withdrawableBalance: string | bigint
  gamesPlayed: number
  gamesWon: number
  joinDate: string | bigint
  lastPlayDate: string | bigint
}

interface ProcessedLeaderboardUser {
  accountId: string
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
  rank: number
}
async function submitUserData(data: string) {
  try {
    const response = await fetch('/api/golem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: data
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit user data');
    }

    const result = await response.json();
    console.log('User data submitted to GolemDB:', result);
  } catch (error) {
    console.error('Error submitting user data:', error);
  }
}
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-400" />
    case 2:
      return <Medal className="h-6 w-6 text-gray-300" />
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />
    default:
      return <span className="text-lg font-bold text-white/70">#{rank}</span>
  }
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30"
    case 2:
      return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300/30"
    case 3:
      return "bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/30"
    default:
      return "bg-background/60 border-border"
  }
}

const formatDate = (dateString: string) => {
  if (dateString === "N/A") return "N/A"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return "N/A"
  }
}

export default function Leaderboard() {
  const { isLoading: contractStatsLoading, error: contractStatsError } = useContractStats()
  const { users: allUsers, isLoading: allUsersLoading, error: allUsersError } = useAllUsers()
  const { address } = useWagmiWallet()
  const [sortBy, setSortBy] = useState<'totalWon' | 'netProfit' | 'winRate' | 'gamesPlayed'>('totalWon')
  const [error, setError] = useState<string>("")

  // Use the multiple user stats hook to fetch stats for all users
  const { userStats: allUserStats, isLoading: userStatsLoading, error: userStatsError } = useMultipleUserStats(allUsers || [])

  // Process and sort the leaderboard data
  const processedLeaderboard = React.useMemo(() => {
    if (!allUsers || !allUserStats || allUsers.length === 0) {
      return []
    }

    console.log("🏆 Processing leaderboard data...")
    console.log(`Found ${allUsers.length} users and ${allUserStats.length} user stats`)

    const leaderboardData: ProcessedLeaderboardUser[] = []

    allUsers.forEach((userAddress, index) => {
      const userStat = allUserStats[index]
      
      if (userStat && userStat.totalBet && !userStat.isLoading) {
        const totalBet = parseFloat(userStat.totalBet)
        const totalWon = parseFloat(userStat.totalWon)
        const totalLost = parseFloat(userStat.totalLost)
        const withdrawableBalance = parseFloat(userStat.withdrawableBalance)
        const gamesPlayed = parseInt(userStat.gamesPlayed) || 0
        const gamesWon = parseInt(userStat.gamesWon) || 0
        const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0
        const netProfit = totalWon - totalLost
        
        const joinTimestamp = parseInt(userStat.joinTimestamp) || 0
        const lastPlayTimestamp = parseInt(userStat.lastPlayTimestamp) || 0
        
        leaderboardData.push({
          accountId: userAddress,
          totalBet,
          totalWon,
          totalLost,
          withdrawableBalance,
          gamesPlayed,
          gamesWon,
          winRate,
          netProfit,
          joinDate: joinTimestamp > 0 ? new Date(joinTimestamp * 1000).toISOString() : "N/A",
          lastPlayDate: lastPlayTimestamp > 0 ? new Date(lastPlayTimestamp * 1000).toISOString() : "N/A",
          rank: 0 // Will be set after sorting
        })
      }
    })

    // Sort users based on selected criteria
    leaderboardData.sort((a, b) => {
      switch (sortBy) {
        case 'totalWon':
          return b.totalWon - a.totalWon
        case 'netProfit':
          return b.netProfit - a.netProfit
        case 'winRate':
          return b.winRate - a.winRate
        case 'gamesPlayed':
          return b.gamesPlayed - a.gamesPlayed
        default:
          return b.totalWon - a.totalWon
      }
    })

    // Assign ranks
    leaderboardData.forEach((user, index) => {
      user.rank = index + 1
    })

    console.log(`✅ Processed ${leaderboardData.length} users for leaderboard`)
    return leaderboardData
  }, [allUsers, allUserStats, sortBy])

  // Set error state
  React.useEffect(() => {
    if (allUsersError) {
      setError(`Failed to fetch users: ${allUsersError.message}`)
    } else if (userStatsError) {
      setError(`Failed to fetch user stats: ${userStatsError.message}`)
    } else {
      setError("")
    }
  }, [allUsersError, userStatsError])

  const getSortButtonClass = (buttonSortBy: string) => {
    return `px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      sortBy === buttonSortBy
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>
            <p className="text-muted-foreground text-sm">Top players by performance</p>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          disabled={allUsersLoading || userStatsLoading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${(allUsersLoading || userStatsLoading) ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Sort Options */}
      <Card className="bg-background/60 border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Sort by:</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('totalWon')}
              className={getSortButtonClass('totalWon')}
            >
              Total Won
            </button>
            <button
              onClick={() => setSortBy('netProfit')}
              className={getSortButtonClass('netProfit')}
            >
              Net Profit
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={getSortButtonClass('winRate')}
            >
              Win Rate
            </button>
            <button
              onClick={() => setSortBy('gamesPlayed')}
              className={getSortButtonClass('gamesPlayed')}
            >
              Games Played
            </button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-600/20 border-red-500/30 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {(allUsersLoading || userStatsLoading) && (
        <Card className="bg-background/60 border-border p-8">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-white">Loading leaderboard...</p>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {!allUsersLoading && !userStatsLoading && !error && (
        <div className="space-y-3">
          {processedLeaderboard.length === 0 ? (
            <Card className="bg-background/60 border-border p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No players found</p>
                <p className="text-muted-foreground text-sm">Be the first to play and appear on the leaderboard!</p>
              </div>
            </Card>
          ) : (
            processedLeaderboard.map((user) => (
              <Card
                key={user.accountId}
                className={`${getRankColor(user.rank)} border p-4 transition-all hover:scale-[1.02] ${
                  user.accountId === address ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(user.rank)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-white">
                          {user.accountId.length > 20 
                            ? `${user.accountId.slice(0, 10)}...${user.accountId.slice(-10)}`
                            : user.accountId
                          }
                        </p>
                        {user.accountId === address && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{user.gamesPlayed} games</span>
                        <span>{user.winRate.toFixed(1)}% win rate</span>
                        <span>Joined {formatDate(user.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Won</p>
                        <p className="font-semibold text-green-400">
                          {formatNEAR(user.totalWon.toString())} U2U
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className={`font-semibold ${user.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {user.netProfit >= 0 ? '+' : ''}{formatNEAR(user.netProfit.toString())} U2U
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawable</p>
                        <p className="font-semibold text-yellow-400">
                          {formatNEAR(user.withdrawableBalance.toString())} U2U
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      {!allUsersLoading && !userStatsLoading && !error && processedLeaderboard.length > 0 && (
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Leaderboard Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{processedLeaderboard.length}</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {formatNEAR(processedLeaderboard.reduce((sum, user) => sum + user.totalWon, 0).toString())} U2U
              </p>
              <p className="text-sm text-muted-foreground">Total Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {processedLeaderboard.reduce((sum, user) => sum + user.gamesPlayed, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {processedLeaderboard.length > 0 
                  ? (processedLeaderboard.reduce((sum, user) => sum + user.winRate, 0) / processedLeaderboard.length).toFixed(1)
                  : 0
                }%
              </p>
              <p className="text-sm text-muted-foreground">Avg Win Rate</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}