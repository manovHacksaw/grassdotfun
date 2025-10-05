"use client"

import React from "react"
import { X, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export type TransactionStatus = "pending" | "confirming" | "confirmed" | "failed" | "resolving"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  status: TransactionStatus
  title: string
  message: string
  transactionHash?: string
  onRetry?: () => void
  onCancel?: () => void
  showCancel?: boolean
  showRetry?: boolean
  explorerUrl?: string
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  title,
  message,
  transactionHash,
  onRetry,
  onCancel,
  showCancel = false,
  showRetry = false,
  explorerUrl
}: TransactionModalProps) {
  if (!isOpen) return null

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
      case "confirming":
        return <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      case "confirmed":
        return <CheckCircle className="w-8 h-8 text-green-400" />
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-400" />
      case "resolving":
        return <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
      default:
        return <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "pending":
      case "confirming":
        return "border-blue-500/30 bg-blue-600/20"
      case "confirmed":
        return "border-green-500/30 bg-green-600/20"
      case "failed":
        return "border-red-500/30 bg-red-600/20"
      case "resolving":
        return "border-yellow-500/30 bg-yellow-600/20"
      default:
        return "border-blue-500/30 bg-blue-600/20"
    }
  }

  const canClose = status === "confirmed" || status === "failed"

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`bg-background/60 backdrop-blur-xl border rounded-3xl p-8 w-full max-w-md relative shadow-2xl ${getStatusColor()}`}>
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 pointer-events-auto text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
          >
            <X size={24} />
          </button>
        )}

        <div className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>

          {/* Message */}
          <p className="text-white/80 text-base leading-relaxed">
            {message}
          </p>

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="bg-background/40 rounded-xl p-4 space-y-2">
              <p className="text-sm text-white/70">Transaction Hash:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xs text-white/90 bg-background/60 px-2 py-1 rounded font-mono">
                  {transactionHash.slice(0, 12)}...{transactionHash.slice(-8)}
                </code>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {showRetry && onRetry && status === "failed" && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            )}
            
            {showCancel && onCancel && (status === "pending" || status === "confirming") && (
              <Button
                onClick={onCancel}
                variant="destructive"
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
            )}

            {canClose && (
              <Button
                onClick={onClose}
                className="flex items-center gap-2"
              >
                {status === "confirmed" ? "Continue" : "Close"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get explorer URL for different networks
export function getExplorerUrl(transactionHash: string, network: string = "testnet"): string {
  // For U2U testnet - adjust this based on your actual explorer
  return `https://explorer.testnet.u2u.xyz/tx/${transactionHash}`
}
