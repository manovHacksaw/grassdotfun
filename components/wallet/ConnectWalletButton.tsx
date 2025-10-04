"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { accountId, isConnected, isLoading, connect, disconnect, balance, refreshBalance, isBalanceLoading, chainId, chainName } = useWallet()
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDisconnect = async () => {
    await disconnect()
  }

  const handleCopyAddress = async () => {
    if (accountId) {
      await navigator.clipboard.writeText(accountId)
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

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Wallet className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (isConnected && accountId) {
    console.log("🔍 ConnectWalletButton: Displaying balance:", balance, "for account:", accountId);
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">Balance:</span>
            {isBalanceLoading ? (
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin text-white/70" />
                <span className="text-white/70 text-sm">Loading...</span>
              </div>
            ) : (
              <span className="text-white font-medium">{balance} ETH</span>
            )}
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshing || isBalanceLoading}
              className="text-white/50 hover:text-white/70 transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white/50 text-xs font-mono">
              {accountId.length > 20 ? `${accountId.slice(0, 10)}...${accountId.slice(-10)}` : accountId}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {chainName && (
            <div className="flex items-center space-x-1">
              <span className="text-white/40 text-xs">{chainName}</span>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </div>
          )}
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  // Use RainbowKit's ConnectButton for the connection UI
  return (
    <div className={className}>
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
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <ShimmerButton onClick={openConnectModal} className="w-full">
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </ShimmerButton>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <ShimmerButton onClick={openChainModal} className="w-full">
                      <ExternalLink className="w-4 h-4" />
                      <span>Wrong network</span>
                    </ShimmerButton>
                  );
                }

                return (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={openChainModal}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    <Button
                      onClick={openAccountModal}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </Button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  )
}
