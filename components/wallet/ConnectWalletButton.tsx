"use client"

import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWagmiWallet } from '@/contexts/WagmiWalletContext'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw } from 'lucide-react'
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
    console.log("🔍 ConnectWalletButton: Displaying balance:", balance, "for address:", address);
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
              <span className="text-white font-medium">{parseFloat(balance).toFixed(4)} U2U</span>
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
              {address.length > 20 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
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
                      <ShimmerButton onClick={openConnectModal} className={className}>
                        <div className="w-4 h-4 mr-2" />
                        <span>Connect Wallet</span>
                      </ShimmerButton>
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

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        const ready = mounted;
        if (!ready) return null;

        return (
          <ShimmerButton onClick={openConnectModal} className={className}>
            <div className="w-4 h-4 mr-2" />
            <span>Connect Wallet</span>
          </ShimmerButton>
        );
      }}
    </ConnectButton.Custom>
  )
}