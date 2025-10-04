"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useContract } from "@/context/contract-provider"
import { useWallet } from "@/contexts/WalletContext"
import {
  Settings,
  Users,
  Gamepad2,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { formatEther } from 'viem'

export default function AdminDashboard() {
  const { selector, accountId, isConnected } = useWallet()
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [resolverService, setResolverService] = useState<ResolverService | null>(null)
  const [contractStats, setContractStats] = useState<any>(null)
  const [resolverAccount, setResolverAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const toastContext = null
  
  // Game resolution form
  const [gameId, setGameId] = useState("")
  const [didWin, setDidWin] = useState(true)
  const [multiplier, setMultiplier] = useState("1.0")

  // Initialize services when wallet is connected
  useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        const newContractService = new ContractService(selector, account)
        const newResolverService = new ResolverService(selector, account)
        setContractService(newContractService)
        setResolverService(newResolverService)
      }
    }
  }, [selector, accountId])

  // Fetch contract stats
  const fetchContractStats = async () => {
    if (!contractService) return

    setIsLoading(true)
    try {
      const stats = await contractService.getContractStats()
      setContractStats(stats)
    } catch (error: any) {
      toast.show({ title: 'Failed to fetch stats', description: String(error?.message || 'Unknown error'), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch resolver account
  const fetchResolverAccount = async () => {
    if (!contractService) return

    try {
      const resolver = await contractService.getOracleAccount()
      setResolverAccount(resolver)
    } catch (error: any) {
      console.error("Error fetching resolver account:", error)
    }
  }

  // Resolve a game
  const resolveGame = async () => {
    if (!resolverService || !gameId) {
      setErrorMessage("Please enter a game ID and ensure resolver service is available")
      return
    }

    setIsLoading(true)
    try {
      const hash = await resolverService.resolveGame(gameId, didWin, parseFloat(multiplier))
      toast.show({ title: 'Resolved', description: `Game resolved successfully! Transaction: ${String(hash).slice(0, 8)}...`, type: 'success' })
      setGameId("")
      setMultiplier("1.0")
    } catch (error: any) {
      toast.show({ title: 'Resolve failed', description: String(error?.message || 'Unknown error'), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Get game details
  const getGameDetails = async () => {
    if (!contractService || !gameId) {
      setErrorMessage("Please enter a game ID")
      return
    }

    setIsLoading(true)
    try {
      const details = await contractService.getGameDetails(gameId)
      if (details) {
        toast.show({ title: 'Game found', description: JSON.stringify(details, null, 2), type: 'success' })
      } else {
        toast.show({ title: 'Game not found', description: 'Please verify the game ID', type: 'warning' })
      }
    } catch (error: any) {
      toast.show({ title: 'Failed to get game details', description: String(error?.message || 'Unknown'), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Clear messages
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
  }

  // Auto-fetch data on load
  useEffect(() => {
    if (isConnected && contractService) {
      fetchContractStats()
      fetchResolverAccount()
    }
  }, [isConnected, contractService])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🔐</div>
          <h2 className="text-white text-4xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-white/70 text-xl mb-8">Please connect your wallet to access the admin panel</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/70">Manage contract and resolve games</p>
          </div>
          <Button 
            onClick={fetchContractStats} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Connection Status */}
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">🔗 Wallet Connected</p>
              <p className="text-green-300 text-xs">Account: {accountId}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm font-medium">Resolver Account</p>
              <p className="text-green-300 text-xs">{resolverAccount || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Messages are displayed via toast notifications */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Statistics */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-semibold text-white">Contract Statistics</h3>
            </div>
            
            {contractStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Users:</span>
                  <span className="text-white font-medium">{contractStats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Games:</span>
                  <span className="text-white font-medium">{contractStats.totalGames}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Bets:</span>
                  <span className="text-white font-medium">{(parseFloat(contractStats.totalBets) / 1e24).toFixed(2)} NEAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Winnings:</span>
                  <span className="text-white font-medium">{(parseFloat(contractStats.totalWinnings) / 1e24).toFixed(2)} NEAR</span>
                </div>
              </div>
            ) : (
              <p className="text-white/60">Click refresh to load statistics</p>
            )}
          </Card>

          {/* Game Resolution */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold text-white">Resolve Game</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Game ID</label>
                <Input
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Enter game ID"
                  className="bg-background/40 border-border"
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm mb-2 block">Outcome</label>
                <div className="flex gap-2">
                  <Button
                    variant={didWin ? "default" : "outline"}
                    onClick={() => setDidWin(true)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Win
                  </Button>
                  <Button
                    variant={!didWin ? "default" : "outline"}
                    onClick={() => setDidWin(false)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Loss
                  </Button>
                </div>
              </div>
              
              {didWin && (
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Multiplier</label>
                  <Input
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    placeholder="1.0"
                    type="number"
                    step="0.1"
                    className="bg-background/40 border-border"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={resolveGame}
                  disabled={isLoading || !gameId}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    "Resolve Game"
                  )}
                </Button>
                <Button
                  onClick={getGameDetails}
                  disabled={isLoading || !gameId}
                  variant="outline"
                  className="flex-1"
                >
                  Get Details
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-background/60 border-border p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={fetchContractStats}
              disabled={isLoading}
              variant="outline"
              className="h-12"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
            <Button
              onClick={fetchResolverAccount}
              disabled={isLoading}
              variant="outline"
              className="h-12"
            >
              <Users className="w-4 h-4 mr-2" />
              Check Resolver
            </Button>
            <Button
              onClick={clearMessages}
              variant="outline"
              className="h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Messages
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
