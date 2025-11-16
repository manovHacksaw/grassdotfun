"use client"

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  status: 'pending' | 'success' | 'error'
  title: string
  description: string
  transactionHash?: string
  onViewTransaction?: () => void
}

export default function TransactionDialog({
  isOpen,
  onClose,
  status,
  title,
  description,
  transactionHash,
  onViewTransaction
}: TransactionDialogProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />
      case 'error':
        return <XCircle className="w-8 h-8 text-red-400" />
    }
  }

  const getStatusColor = () => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/20">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={cn(
              "p-4 rounded-full border-2",
              getStatusColor()
            )}>
              {getStatusIcon()}
            </div>
          </div>
          <DialogTitle className="text-white text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {description}
          </DialogDescription>
        </DialogHeader>

        {transactionHash && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Transaction:</span>
              <span className="font-mono text-white text-sm">
                {transactionHash.slice(0, 8)}...{transactionHash.slice(-6)}
              </span>
            </div>
            {onViewTransaction && (
              <button
                onClick={onViewTransaction}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                View on Blockscout
              </button>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
