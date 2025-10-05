"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GameTransactionWrapperProps {
  children: React.ReactNode
  onStartGame: () => Promise<string>
  onResolveGame: () => Promise<string>
  isGameActive: boolean
  isGameFinished: boolean
  onGameStart: () => void
  onGameEnd: () => void
}

export default function GameTransactionWrapper({
  children,
  onStartGame,
  onResolveGame,
  isGameActive,
  isGameFinished,
  onGameStart,
  onGameEnd
}: GameTransactionWrapperProps) {
  const [betDialogOpen, setBetDialogOpen] = useState(false)
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false)
  const [betTransactionHash, setBetTransactionHash] = useState<string>()
  const [resolutionTransactionHash, setResolutionTransactionHash] = useState<string>()
  const [betStatus, setBetStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [resolutionStatus, setResolutionStatus] = useState<'pending' | 'success' | 'error'>('pending')

  const handleStartGame = async () => {
    setBetDialogOpen(true)
    setBetStatus('pending')
    
    try {
      const hash = await onStartGame()
      setBetTransactionHash(hash)
      setBetStatus('success')
      
      // Close bet dialog after a short delay and start the game
      setTimeout(() => {
        setBetDialogOpen(false)
        onGameStart()
      }, 1500)
      
    } catch (error) {
      setBetStatus('error')
      toast.error("Failed to place bet", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  const handleResolveGame = async () => {
    setResolutionDialogOpen(true)
    setResolutionStatus('pending')
    
    try {
      const hash = await onResolveGame()
      setResolutionTransactionHash(hash)
      setResolutionStatus('success')
      
      // Close resolution dialog after a short delay
      setTimeout(() => {
        setResolutionDialogOpen(false)
        onGameEnd()
      }, 1500)
      
    } catch (error) {
      setResolutionStatus('error')
      toast.error("Failed to resolve game", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  // Auto-trigger resolution when game finishes
  useEffect(() => {
    if (isGameFinished && isGameActive) {
      handleResolveGame()
    }
  }, [isGameFinished, isGameActive])

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />
      case 'error':
        return <XCircle className="w-8 h-8 text-red-400" />
    }
  }

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return 'border-blue-400/20 bg-blue-400/5'
      case 'success':
        return 'border-green-400/20 bg-green-400/5'
      case 'error':
        return 'border-red-400/20 bg-red-400/5'
    }
  }

  return (
    <>
      {/* Bet Transaction Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/20">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={cn(
                "p-4 rounded-full border-2",
                getStatusColor(betStatus)
              )}>
                {getStatusIcon(betStatus)}
              </div>
            </div>
            <DialogTitle className="text-white text-xl">
              {betStatus === 'pending' && "Placing Your Bet"}
              {betStatus === 'success' && "Bet Placed Successfully!"}
              {betStatus === 'error' && "Bet Failed"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {betStatus === 'pending' && "Placing your bet on U2U Solaris... hang tight!"}
              {betStatus === 'success' && "Your bet has been confirmed on-chain. Game starting..."}
              {betStatus === 'error' && "There was an issue placing your bet. Please try again."}
            </DialogDescription>
          </DialogHeader>

          {betTransactionHash && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Transaction:</span>
                <span className="font-mono text-white text-sm">
                  {betTransactionHash.slice(0, 8)}...{betTransactionHash.slice(-6)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Transaction Dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/20">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={cn(
                "p-4 rounded-full border-2",
                getStatusColor(resolutionStatus)
              )}>
                {getStatusIcon(resolutionStatus)}
              </div>
            </div>
            <DialogTitle className="text-white text-xl">
              {resolutionStatus === 'pending' && "Resolving Game"}
              {resolutionStatus === 'success' && "Game Resolved!"}
              {resolutionStatus === 'error' && "Resolution Failed"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {resolutionStatus === 'pending' && "Resolving game result on-chain..."}
              {resolutionStatus === 'success' && "Game resolved successfully! Transaction confirmed."}
              {resolutionStatus === 'error' && "There was an issue resolving the game. Please try again."}
            </DialogDescription>
          </DialogHeader>

          {resolutionTransactionHash && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Transaction:</span>
                <span className="font-mono text-white text-sm">
                  {resolutionTransactionHash.slice(0, 8)}...{resolutionTransactionHash.slice(-6)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Render children with transaction handlers */}
      {React.cloneElement(children as React.ReactElement, {
        onStartGame: handleStartGame,
        onResolveGame: handleResolveGame,
        isTransactionPending: betDialogOpen || resolutionDialogOpen,
      })}
    </>
  )
}
