"use client"

import React, { useEffect } from 'react'
import { useWagmiWallet } from '@/contexts/WagmiWalletContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Lock } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

interface WalletGateProps {
  children: React.ReactNode
  showConnectPrompt?: boolean
  onConnectClick?: () => void
}

export default function WalletGate({ 
  children, 
  showConnectPrompt = true, 
  onConnectClick 
}: WalletGateProps) {
  const { isConnected } = useWagmiWallet()

  useEffect(() => {
    if (!isConnected && showConnectPrompt) {
      toast.error("Please connect your wallet to play the games.", {
        duration: 4000,
      })
    }
  }, [isConnected, showConnectPrompt])

  if (!isConnected) {
    if (!showConnectPrompt) {
      return null
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur border-white/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-white/10 border border-white/20">
                <Lock className="w-8 h-8 text-white/70" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Wallet Required
              </h3>
              <p className="text-white/70 text-sm">
                Connect your wallet to access the games and start playing on U2U Solaris Mainnet.
              </p>
            </div>

            <div className="space-y-3">
              <ShimmerButton 
                onClick={onConnectClick}
                className="w-full"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </ShimmerButton>
              
              <p className="text-white/50 text-xs">
                Your wallet information will be displayed in the top navigation once connected.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
