"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useContractStats, useIsOwner, useHouseProfit, useWithdrawHouseProfit } from "@/lib/wagmiContractService"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { 
  Settings, 
  Users, 
  Gamepad2, 
  DollarSign, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Wallet,
  Lock
} from "lucide-react"

export default function AdminDashboard() {
  const { address, isConnected } = useWagmiWallet()
  const { data: contractStats, isLoading: contractStatsLoading, error: contractStatsError } = useContractStats()
  const { isOwner, ownerAddress, isLoading: isOwnerLoading } = useIsOwner()
  const { houseProfit, isLoading: houseProfitLoading, refetch: refetchHouseProfit } = useHouseProfit()
  const { withdrawHouseProfit, isPending: isWithdrawing, isConfirmed: isWithdrawConfirmed, error: withdrawError } = useWithdrawHouseProfit()
  
  const [resolverAccount, setResolverAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  
  // House profit withdrawal
  const [withdrawAmount, setWithdrawAmount] = useState("")
  
  // Game resolution form
  const [gameId, setGameId] = useState("")
  const [didWin, setDidWin] = useState(true)
  const [multiplier, setMultiplier] = useState("1.0")

  // Set resolver account from deployment info
  useEffect(() => {
    setResolverAccount("0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2") // From deployment info
  }, [])

  // Contract stats are now fetched automatically via wagmi hooks
  const fetchContractStats = async () => {
    if (contractStatsError) {
      setErrorMessage(`Failed to fetch contract stats: ${contractStatsError.message}`)
    } else if (contractStats) {
      setSuccessMessage("Contract stats loaded successfully")
    }
  }

  // Resolver account is set from deployment info
  const fetchResolverAccount = async () => {
    setSuccessMessage(`Resolver account: ${resolverAccount}`)
  }

  // Resolve a game using the API endpoint
  const resolveGame = async () => {
    if (!gameId) {
      setErrorMessage("Please enter a game ID")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/resolve-game-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          didWin,
          multiplier: parseFloat(multiplier),
          gameType: 'admin',
          player: address
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(`Game resolved successfully! Transaction: ${result.transactionHash.slice(0, 8)}...`)
        setGameId("")
        setMultiplier("1.0")
      } else {
        const errorData = await response.json()
        setErrorMessage(`Failed to resolve game: ${errorData.message}`)
      }
    } catch (error: unknown) {
      setErrorMessage(`Failed to resolve game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Get game details - not implemented yet with wagmi hooks
  const getGameDetails = async () => {
    if (!gameId) {
      setErrorMessage("Please enter a game ID")
      return
    }

    setErrorMessage("Game details not implemented yet - use wagmi hooks directly")
  }

  // Clear messages
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
  }

  // Handle house profit withdrawal
  const handleWithdrawHouseProfit = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMessage("Please enter a valid amount to withdraw")
      return
    }

    if (parseFloat(withdrawAmount) > parseFloat(houseProfit)) {
      setErrorMessage(`Cannot withdraw more than available profit: ${houseProfit} CELO`)
      return
    }

    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await withdrawHouseProfit(withdrawAmount)
      setSuccessMessage(`Withdrawal initiated! Amount: ${withdrawAmount} CELO`)
      setWithdrawAmount("")
      // Refetch house profit after a delay
      setTimeout(() => {
        refetchHouseProfit()
      }, 3000)
    } catch (error: unknown) {
      setErrorMessage(`Failed to withdraw: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle withdraw all
  const handleWithdrawAll = () => {
    if (parseFloat(houseProfit) > 0) {
      setWithdrawAmount(houseProfit)
    }
  }

  // Auto-fetch data on load
  useEffect(() => {
    if (isConnected) {
      fetchContractStats()
      fetchResolverAccount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  // Show success message when withdrawal is confirmed
  useEffect(() => {
    if (isWithdrawConfirmed) {
      setSuccessMessage("Withdrawal confirmed successfully!")
      refetchHouseProfit()
    }
  }, [isWithdrawConfirmed, refetchHouseProfit])

  // Show error message when withdrawal fails
  useEffect(() => {
    if (withdrawError) {
      setErrorMessage(`Withdrawal failed: ${withdrawError.message}`)
    }
  }, [withdrawError])

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

  // Check if user is owner
  if (isOwnerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-xl">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-white text-4xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/70 text-xl mb-4">Only the contract owner can access this page.</p>
          <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 mt-6">
            <p className="text-red-400 text-sm font-medium mb-2">Connected Address:</p>
            <p className="text-red-300 text-xs break-all">{address}</p>
            <p className="text-red-400 text-sm font-medium mt-4 mb-2">Owner Address:</p>
            <p className="text-red-300 text-xs break-all">{ownerAddress || "Loading..."}</p>
          </div>
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Access Granted
              </p>
              <p className="text-green-300 text-xs break-all">Owner: {ownerAddress || "Loading..."}</p>
            </div>
            <div>
              <p className="text-green-400 text-sm font-medium">🔗 Wallet Connected</p>
              <p className="text-green-300 text-xs break-all">Account: {address}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm font-medium">Resolver Account</p>
              <p className="text-green-300 text-xs break-all">{resolverAccount || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-red-400 text-sm font-medium">⚠️ {errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 mb-6">
            <p className="text-green-400 text-sm font-medium">✅ {successMessage}</p>
          </div>
        )}

        {/* House Profit Withdrawal - Admin Only */}
        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-yellow-500" />
            <h3 className="text-xl font-semibold text-white">House Profit (User Losses)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-background/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70">Available Profit:</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {houseProfitLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin inline" />
                  ) : (
                    `${parseFloat(houseProfit).toFixed(4)} CELO`
                  )}
                </span>
              </div>
              <p className="text-white/50 text-xs mt-2">
                This is the total amount lost by users minus winnings and previous withdrawals
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                type="number"
                step="0.0001"
                className="bg-background/40 border-border flex-1"
                disabled={isWithdrawing || isLoading}
              />
              <Button
                onClick={handleWithdrawAll}
                variant="outline"
                disabled={isWithdrawing || isLoading || parseFloat(houseProfit) <= 0}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            </div>

            <Button
              onClick={handleWithdrawHouseProfit}
              disabled={isWithdrawing || isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(houseProfit)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isWithdrawing || isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw House Profit
                </>
              )}
            </Button>
          </div>
        </Card>

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
                  <span className="text-white font-medium">{parseFloat(contractStats.totalBets).toFixed(4)} CELO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Winnings:</span>
                  <span className="text-white font-medium">{parseFloat(contractStats.totalWinnings).toFixed(4)} CELO</span>
                </div>
              </div>
            ) : contractStatsLoading ? (
              <p className="text-white/50">Loading contract stats...</p>
            ) : contractStatsError ? (
              <p className="text-red-400">Error loading stats: {contractStatsError.message}</p>
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
              onClick={() => {
                fetchContractStats()
                refetchHouseProfit()
              }}
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
