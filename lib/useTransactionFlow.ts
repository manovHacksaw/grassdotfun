"use client"

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface TransactionState {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  transactionHash?: string
  error?: string
}

interface UseTransactionFlowReturn {
  transactionState: TransactionState
  startTransaction: (transactionFn: () => Promise<string>) => Promise<void>
  resetTransaction: () => void
  setTransactionHash: (hash: string) => void
  setError: (error: string) => void
}

export function useTransactionFlow(): UseTransactionFlowReturn {
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isPending: false,
    isSuccess: false,
    isError: false,
  })

  const startTransaction = useCallback(async (transactionFn: () => Promise<string>) => {
    setTransactionState({
      isPending: true,
      isSuccess: false,
      isError: false,
    })

    try {
      const hash = await transactionFn()
      setTransactionState(prev => ({
        ...prev,
        isPending: false,
        isSuccess: true,
        transactionHash: hash,
      }))
      
      toast.success("Transaction confirmed!", {
        description: `Transaction hash: ${hash.slice(0, 8)}...${hash.slice(-6)}`,
        duration: 5000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      setTransactionState(prev => ({
        ...prev,
        isPending: false,
        isError: true,
        error: errorMessage,
      }))
      
      toast.error("Transaction failed", {
        description: errorMessage,
        duration: 5000,
      })
    }
  }, [])

  const resetTransaction = useCallback(() => {
    setTransactionState({
      isPending: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  const setTransactionHash = useCallback((hash: string) => {
    setTransactionState(prev => ({
      ...prev,
      transactionHash: hash,
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setTransactionState(prev => ({
      ...prev,
      isError: true,
      error,
    }))
  }, [])

  return {
    transactionState,
    startTransaction,
    resetTransaction,
    setTransactionHash,
    setError,
  }
}
