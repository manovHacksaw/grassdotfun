"use client"

import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWagmiWallet } from '@/contexts/WagmiWalletContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, Check, RefreshCw, Wallet, ExternalLink } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { address, isConnected, isConnecting, balance, isBalanceLoading, refreshBalance } = useWagmiWallet()
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshing(true)
    try {
      await refreshBalance()
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isConnecting) {
    return (
      <Button disabled className={className}>
        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          if (!ready) return null;

          if (!connected) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShimmerButton onClick={openConnectModal} className={className}>
                    <Wallet className="w-4 h-4 mr-2" />
                    <span>Connect Wallet</span>
                  </ShimmerButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connect your wallet to start playing</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          if (chain.unsupported) {
            return (
              <Button onClick={openChainModal} variant="destructive" className={className}>
                Wrong network
              </Button>
            );
          }

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      {isBalanceLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        `${parseFloat(balance).toFixed(3)} CELO`
                      )}
                    </Badge>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-background/95 backdrop-blur border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Wallet Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openAccountModal}
                      className="text-white/70 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Address:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-sm">
                          {address.slice(0, 8)}...{address.slice(-6)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAddress}
                          className="text-white/50 hover:text-white/70 p-1 h-auto"
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Balance:</span>
                      <div className="flex items-center gap-2">
                        {isBalanceLoading ? (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-white/70" />
                            <span className="text-white/70 text-sm">Loading...</span>
                          </div>
                        ) : (
                          <span className="text-white font-medium">
                            {parseFloat(balance).toFixed(4)} CELO
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshBalance}
                          disabled={isRefreshing || isBalanceLoading}
                          className="text-white/50 hover:text-white/70 p-1 h-auto"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Network:</span>
                      <Badge variant="outline" className="border-white/20 text-white">
                        CELO Mainnet
                      </Badge>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        }}
      </ConnectButton.Custom>
    )
  }

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        const ready = mounted;
        if (!ready) return null;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <ShimmerButton onClick={openConnectModal} className={className}>
                <Wallet className="w-4 h-4 mr-2" />
                <span>Connect Wallet</span>
              </ShimmerButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connect your wallet to start playing</p>
            </TooltipContent>
          </Tooltip>
        );
      }}
    </ConnectButton.Custom>
  )
}