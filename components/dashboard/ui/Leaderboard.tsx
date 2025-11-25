"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useContractStats, useAllUsers, useMultipleUserStats } from "@/lib/wagmiContractService"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { formatCELO } from "@/lib/currencyUtils"
import { Trophy, Medal, Crown, Users, RefreshCw, TrendingUp, DollarSign, Swords } from "lucide-react"

// --- Types ---
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

// --- Helper Components ---

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-400 animate-pulse" />
    case 2:
      return <Medal className="h-6 w-6 text-gray-300" />
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />
    default:
      return <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{rank}</span>
  }
}

const getRankStyles = (rank: number, isCurrentUser: boolean) => {
  const baseStyle = "transition-all duration-300 border backdrop-blur-md"
  
  if (isCurrentUser) {
    return `${baseStyle} bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]`
  }

  switch (rank) {
    case 1:
      return `${baseStyle} bg-gradient-to-r from-yellow-500/10 to-yellow-900/10 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]`
    case 2:
      return `${baseStyle} bg-gradient-to-r from-gray-400/10 to-gray-800/10 border-gray-400/40`
    case 3:
      return `${baseStyle} bg-gradient-to-r from-amber-700/10 to-amber-900/10 border-amber-600/40`
    default:
      return `${baseStyle} bg-card/40 border-border/40 hover:bg-card/60`
  }
}

const formatDate = (dateString: string) => {
  if (dateString === "N/A") return "N/A"
  try {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return "N/A"
  }
}

const formatSortLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function Leaderboard() {
  const { isLoading: contractStatsLoading } = useContractStats()
  const { users: allUsers, isLoading: allUsersLoading, error: allUsersError } = useAllUsers()
  const { address } = useWagmiWallet()
  const [sortBy, setSortBy] = useState<"totalWon" | "netProfit" | "winRate" | "gamesPlayed">("totalWon")
  const [error, setError] = useState<string>("")

  // Use the multiple user stats hook to fetch stats for all users (limited to first 20 for better scroll demo)
  const {
    userStats: allUserStats,
    isLoading: userStatsLoading,
    error: userStatsError,
  } = useMultipleUserStats((allUsers || []).slice(0, 20))

  // Process and sort the leaderboard data
  const processedLeaderboard = React.useMemo(() => {
    if (!allUsers || !allUserStats || allUsers.length === 0) {
      return []
    }

    const limitedUsers = allUsers.slice(0, 20)
    const leaderboardData: ProcessedLeaderboardUser[] = []

    limitedUsers.forEach((userAddress, index) => {
      const userStat = allUserStats[index]

      if (userStat && userStat.totalBet && !userStat.isLoading) {
        const totalBet = Number.parseFloat(userStat.totalBet)
        const totalWon = Number.parseFloat(userStat.totalWon)
        const totalLost = Number.parseFloat(userStat.totalLost)
        const withdrawableBalance = Number.parseFloat(userStat.withdrawableBalance)
        const gamesPlayed = Number.parseInt(userStat.gamesPlayed) || 0
        const gamesWon = Number.parseInt(userStat.gamesWon) || 0
        const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0
        const netProfit = totalWon - totalLost

        const joinTimestamp = Number.parseInt(userStat.joinTimestamp) || 0
        const lastPlayTimestamp = Number.parseInt(userStat.lastPlayTimestamp) || 0

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
          rank: 0,
        })
      }
    })

    leaderboardData.sort((a, b) => {
      switch (sortBy) {
        case "totalWon": return b.totalWon - a.totalWon
        case "netProfit": return b.netProfit - a.netProfit
        case "winRate": return b.winRate - a.winRate
        case "gamesPlayed": return b.gamesPlayed - a.gamesPlayed
        default: return b.totalWon - a.totalWon
      }
    })

    leaderboardData.forEach((user, index) => { user.rank = index + 1 })
    return leaderboardData
  }, [allUsers, allUserStats, sortBy])

  React.useEffect(() => {
    if (allUsersError) setError(`Failed to fetch users: ${allUsersError.message}`)
    else if (userStatsError) setError(`Failed to fetch user stats: ${userStatsError.message}`)
    else setError("")
  }, [allUsersError, userStatsError])

  const isLoading = allUsersLoading || userStatsLoading

  return (
    <>
      {/* CSS to hide scrollbar but allow scrolling */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="space-y-6 w-full p-2">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Arena Leaderboard</h2>
              <p className="text-xs text-muted-foreground">Real-time player performance metrics</p>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-background/40 hover:bg-background/60 border-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {/* Global Stats Summary - Moved Top for better UX */}
        {!isLoading && !error && processedLeaderboard.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <StatsCard 
              label="Total Players" 
              value={processedLeaderboard.length.toString()} 
              icon={<Users className="h-4 w-4 text-blue-400" />} 
            />
            <StatsCard 
              label="Total Won" 
              value={`${formatCELO(processedLeaderboard.reduce((sum, u) => sum + u.totalWon, 0).toString())} CELO`} 
              icon={<DollarSign className="h-4 w-4 text-green-400" />} 
              textColor="text-green-400"
            />
            <StatsCard 
              label="Games Played" 
              value={processedLeaderboard.reduce((sum, u) => sum + u.gamesPlayed, 0).toString()} 
              icon={<Swords className="h-4 w-4 text-purple-400" />} 
            />
            <StatsCard 
              label="Avg Win Rate" 
              value={`${(processedLeaderboard.reduce((sum, u) => sum + u.winRate, 0) / processedLeaderboard.length).toFixed(1)}%`} 
              icon={<TrendingUp className="h-4 w-4 text-orange-400" />} 
            />
          </div>
        )}

        {/* Main Content Area */}
        <Card className="bg-black/20 border-white/10 overflow-hidden backdrop-blur-sm">
          {/* Controls Header */}
          <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
             <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Player Rankings</h3>
             
             {/* Segmented Control for Sorting */}
             <div className="bg-white/5 p-1 rounded-lg flex space-x-1">
               {(["totalWon", "netProfit", "winRate", "gamesPlayed"] as const).map((key) => (
                 <button
                   key={key}
                   onClick={() => setSortBy(key)}
                   className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                     sortBy === key
                       ? "bg-primary text-primary-foreground shadow-md"
                       : "text-muted-foreground hover:text-white hover:bg-white/5"
                   }`}
                 >
                   {formatSortLabel(key)}
                 </button>
               ))}
             </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-8 text-center bg-red-500/10 m-4 rounded-xl border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm animate-pulse">Syncing blockchain data...</p>
            </div>
          )}

          {/* SCROLLABLE LIST CONTAINER */}
          {/* max-h-[600px] defines the height constraint. overflow-y-auto enables scroll. no-scrollbar hides the bar. */}
          {!isLoading && !error && (
            <div className="max-h-[600px] overflow-y-auto no-scrollbar p-4 space-y-2">
              {processedLeaderboard.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No players found yet.</p>
                </div>
              ) : (
                processedLeaderboard.map((user) => (
                  <div
                    key={user.accountId}
                    className={`rounded-xl p-4 relative group ${getRankStyles(user.rank, user.accountId === address)}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Column */}
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(user.rank)}
                      </div>

                      {/* User Info Column */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm md:text-base text-white truncate">
                            {user.accountId}
                          </p>
                          {user.accountId === address && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider rounded">You</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Swords className="h-3 w-3" /> {user.gamesPlayed} plays
                          </span>
                          <span className="hidden sm:inline text-white/20">|</span>
                          <span>Joined {formatDate(user.joinDate)}</span>
                        </div>
                      </div>

                      {/* Stats Grid Column */}
                      <div className="flex-shrink-0 text-right grid grid-cols-2 gap-x-6 gap-y-1 w-auto min-w-[140px]">
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase text-muted-foreground">Total Won</p>
                          <p className="font-bold text-green-400 text-sm">{formatCELO(user.totalWon.toString())}</p>
                        </div>
                        
                        <div className="col-span-2 sm:col-span-1">
                           <p className="text-[10px] uppercase text-muted-foreground">Win Rate</p>
                           <p className={`font-bold text-sm ${user.winRate > 50 ? 'text-blue-400' : 'text-white/70'}`}>
                             {user.winRate.toFixed(0)}%
                           </p>
                        </div>

                        {/* Visible only on larger screens or expanding card */}
                        <div className="col-span-2 mt-1 pt-1 border-t border-white/5 sm:hidden">
                           <div className="flex justify-between items-center">
                             <span className="text-[10px] text-muted-foreground">Profit</span>
                             <span className={`text-xs font-medium ${user.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {user.netProfit >= 0 ? "+" : ""}{formatCELO(user.netProfit.toString())}
                             </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

// Simple internal component for the top stats
function StatsCard({ label, value, icon, textColor = "text-white" }: { label: string, value: string, icon: React.ReactNode, textColor?: string }) {
  return (
    <Card className="bg-white/5 border-white/10 p-3 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
      <div className="bg-background/40 p-2 rounded-full mb-2">
        {icon}
      </div>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    </Card>
  )
}