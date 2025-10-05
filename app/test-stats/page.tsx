"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useContractStats } from "@/lib/wagmiContractService"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"

export default function TestStatsPage() {
  const { address, isConnected } = useWagmiWallet()
  const { data: contractStats, isLoading, error } = useContractStats()
  const [testResult, setTestResult] = useState<string>("")

  const testContractStats = async () => {
    if (error) {
      setTestResult(`❌ Error: ${error.message}`)
      return
    }

    if (contractStats) {
      setTestResult(`✅ Contract Stats: ${JSON.stringify(contractStats, null, 2)}`)
    } else {
      setTestResult("⏳ Loading contract stats...")
    }
  }

  const testUserStats = async () => {
    setTestResult("❌ User stats test not implemented yet - use wagmi hooks directly")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Contract Statistics Test</h1>
        
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Connection Status</h2>
          <div className="space-y-2 text-white/80">
            <p>Wallet Connected: {isConnected ? "✅ Yes" : "❌ No"}</p>
            <p>Account ID: {address || "Not connected"}</p>
            <p>Contract Stats Loading: {isLoading ? "⏳ Loading..." : "✅ Ready"}</p>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Actions</h2>
          <div className="space-x-4">
            <Button 
              onClick={testContractStats} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Contract Stats
            </Button>
            <Button 
              onClick={testUserStats} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Test User Stats
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Result</h2>
            <pre className="text-white/80 text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
