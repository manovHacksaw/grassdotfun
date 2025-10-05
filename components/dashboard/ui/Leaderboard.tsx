"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useContractStats } from "@/lib/wagmiContractService"
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
  const { data: contractStats, isLoading: contractStatsLoading, error: contractStatsError } = useContractStats()
  const { address } = useWagmiWallet()
  const [leaderboard, setLeaderboard] = useState<ProcessedLeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'totalWon' | 'netProfit' | 'winRate' | 'gamesPlayed'>('totalWon')
  const [error, setError] = useState<string>("")

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log("🏆 Fetching leaderboard data...")
      
      // For now, show a message that leaderboard is not fully implemented with real contract data
      // In the future, this would fetch all users from the contract
      setError("Leaderboard with real contract data is not fully implemented yet. Use wagmi hooks to fetch individual user stats.")
      
      // Generate some dummy data for demonstration
      const dummyUsers: ProcessedLeaderboardUser[] = [
        {
          accountId: "0x1234...5678",
          totalBet: 10.5,
          totalWon: 15.2,
          totalLost: 5.3,
          withdrawableBalance: 2.1,
          gamesPlayed: 25,
          gamesWon: 18,
          winRate: 72,
          netProfit: 4.7,
          joinDate: "2024-01-15",
          lastPlayDate: "2024-01-20",
          rank: 1
        }
      ]
      
      setLeaderboard(dummyUsers)
      
      // Leaderboard with real contract data will be implemented in the future
      
    } catch (error: any) {
      console.error("❌ Failed to fetch leaderboard:", error)
      setError(error.message || "Failed to fetch leaderboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [sortBy])

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
          onClick={fetchLeaderboard}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
      {isLoading && (
        <Card className="bg-background/60 border-border p-8">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-white">Loading leaderboard...</p>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <Card className="bg-background/60 border-border p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No players found</p>
                <p className="text-muted-foreground text-sm">Be the first to play and appear on the leaderboard!</p>
              </div>
            </Card>
          ) : (
            leaderboard.map((user) => (
              <Card
                key={user.accountId}
                className={`${getRankColor(user.rank)} border p-4 transition-all hover:scale-[1.02] ${
                  user.accountId === accountId ? 'ring-2 ring-primary/50' : ''
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
                        {user.accountId === accountId && (
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
                          {formatNEAR(user.totalWon.toString())} NEAR
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className={`font-semibold ${user.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {user.netProfit >= 0 ? '+' : ''}{formatNEAR(user.netProfit.toString())} NEAR
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawable</p>
                        <p className="font-semibold text-yellow-400">
                          {formatNEAR(user.withdrawableBalance.toString())} NEAR
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
      {!isLoading && !error && leaderboard.length > 0 && (
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Leaderboard Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {formatNEAR(leaderboard.reduce((sum, user) => sum + user.totalWon, 0).toString())} NEAR
              </p>
              <p className="text-sm text-muted-foreground">Total Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {leaderboard.reduce((sum, user) => sum + user.gamesPlayed, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {leaderboard.length > 0 
                  ? (leaderboard.reduce((sum, user) => sum + user.winRate, 0) / leaderboard.length).toFixed(1)
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