"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import confetti from "canvas-confetti"
import { X } from "lucide-react"
import { useSound } from "@/lib/useSound"
import { useWagmiContractService } from "@/lib/wagmiContractService"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import { useContract } from "@/contexts/ContractProvider"
import { gameOutcomeService } from "@/lib/gameOutcomeService"
import { formatU2U, formatGameCurrency, getConversionText } from "@/lib/currencyUtils"
import { TransactionModal, TransactionStatus, getExplorerUrl } from "@/components/ui/TransactionModal"
import { toast } from "sonner"

type GameStatus = "idle" | "in-progress" | "won" | "lost" | "cashed-out"

type Difficulty = "Easy" | "Hard"

interface PaajiOnTopProps {
  rows?: number
  cols?: number
}

type RowConfig = {
  safeIndices: number[]
  revealedIndex?: number
}

type PopupType = "win" | "lose" | null

type PopupState = {
  isOpen: boolean
  type: PopupType
}

export function PaajiOnTop({ rows = 8, cols = 4 }: PaajiOnTopProps) {
  const { address, isConnected, balance, isBalanceLoading, refreshBalance } = useWagmiWallet()
  const { startGame: startContractGame, isPending: isContractPending, isConfirming, isConfirmed, error: contractError, hash: contractTransactionHash } = useWagmiContractService()
  const { getUserStats } = useContract()
  const [status, setStatus] = React.useState<GameStatus>("idle")
  const [currentRow, setCurrentRow] = React.useState(0)
  const [config, setConfig] = React.useState<RowConfig[]>([])
  const [steps, setSteps] = React.useState(0)
  const [difficulty, setDifficulty] = React.useState<Difficulty>("Easy")
  const [numCols, setNumCols] = React.useState(cols)
  const [betAmount, setBetAmount] = React.useState<string>("0.10")
  const [popup, setPopup] = React.useState<PopupState>({ isOpen: false, type: null })
  const [isLoading, setIsLoading] = React.useState(false)
  const [gameId, setGameId] = React.useState<string>("")
  const [transactionHash, setTransactionHash] = React.useState<string>("")
  const [errorMessage, setErrorMessage] = React.useState<string>("")
  const [successMessage, setSuccessMessage] = React.useState<string>("")
  const [waitingForConfirmation, setWaitingForConfirmation] = React.useState(false)
  const [transactionModal, setTransactionModal] = React.useState<{
    isOpen: boolean
    status: TransactionStatus
    title: string
    message: string
    transactionHash?: string
  }>({
    isOpen: false,
    status: "pending",
    title: "",
    message: "",
    transactionHash: undefined
  })
  const [resolutionModal, setResolutionModal] = React.useState<{
    isOpen: boolean
    transactionHash?: string
  }>({
    isOpen: false,
    transactionHash: undefined
  })
  const walletBalance = balance

  const [PaajiWinSound] = useSound("/sounds/PaajiWin.mp3");
  const [BetSound] = useSound("/sounds/Bet.mp3");
  const [PaajiLoseSound] = useSound("/sounds/PaajiLose.mp3");
  const [PaajiCashoutSound] = useSound("/sounds/PaajiCashOut.mp3");

  // Resolve game directly
  const resolveGame = async (didWin: boolean, finalMultiplier: number) => {
    if (!gameId || !address) {
      console.log("❌ Cannot resolve game - missing gameId or address");
      return;
    }

    try {
      console.log(`🚀 Resolving game: ${gameId}, Win: ${didWin}, Multiplier: ${finalMultiplier}`);
      
      // Show resolution toast
      toast.loading("Resolving game result on-chain...", {
        id: "game-resolution"
      });
      
      const result = await gameOutcomeService.resolveGame({
        gameId,
        didWin,
        multiplier: finalMultiplier,
        timestamp: Date.now(),
        gameType: "paaji",
        player: address
      });
      
      // Show success toast with transaction hash
      toast.success("Game resolved successfully! Transaction confirmed.", {
        id: "game-resolution",
        description: `Transaction: ${result.transactionHash?.slice(0, 8)}...${result.transactionHash?.slice(-6)}`,
        duration: 5000,
      });
      
      if (didWin) {
        setSuccessMessage(`🎉 Game won! Resolved at ${finalMultiplier.toFixed(2)}× multiplier.`);
      } else {
        setSuccessMessage(`Game resolved successfully.`);
      }
    } catch (error: any) {
      console.error("❌ Error resolving game:", error);
      
      // Show error toast
      toast.error("Failed to resolve game", {
        id: "game-resolution",
        description: error.message || "Please try again",
        duration: 5000,
      });
      
      setErrorMessage(`Failed to resolve game: ${error.message}`);
    }
  };

  const multiplier = React.useMemo(() => {
    // Paaji On Top Multiplier Algorithm
    // Easy Mode: 1.12X → 1.36X → 1.65X → 1.95X → 2.0X → 2.4X → 2.6X → 3.0X (max)
    // Hard Mode: 1.25X → 1.56X → 1.95X → 2.2X → 2.8X → 3.5X → 4.3X → 5.0X (max)
    const easyMultipliers = [1.12, 1.36, 1.65, 1.95, 2.0, 2.4, 2.6, 3.0];
    const hardMultipliers = [1.25, 1.56, 1.95, 2.2, 2.8, 3.5, 4.3, 5.0];
    
    // Select the appropriate multiplier array based on difficulty
    const multipliers = difficulty === "Easy" ? easyMultipliers : hardMultipliers;
    
    // Return the multiplier for the current step (steps is 0-indexed)
    if (steps >= multipliers.length) {
      return multipliers[multipliers.length - 1].toFixed(2); // Max multiplier
    }
    
    return multipliers[steps].toFixed(2);
  }, [steps, difficulty])

  const canPlay = status === "in-progress"

  // Contract service is now handled by wagmi hooks

  // Balance is now handled by Wagmi wallet context

  // Clear messages after a delay
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
    setTransactionHash("")
  }

  // Auto-clear messages after 5 seconds
  React.useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Watch for transaction confirmation
  React.useEffect(() => {
    console.log('🔍 Paaji transaction confirmation check:', {
      waitingForConfirmation,
      isConfirmed,
      transactionHash,
      contractTransactionHash
    });
    
    if (waitingForConfirmation && isConfirmed && (transactionHash || contractTransactionHash)) {
      console.log('✅ Paaji transaction confirmed! Starting game...');
      
      // Transaction confirmed! Start the game
      setWaitingForConfirmation(false)
      
      const finalHash = transactionHash || contractTransactionHash;
      
      // Show success state briefly before starting game
      setTransactionModal({
        isOpen: true,
        status: "confirmed",
        title: "Bet Placed Successfully!",
        message: "Your bet has been confirmed on-chain. Game starting...",
        transactionHash: finalHash
      })
      
      // Wait a moment to show success state, then start the game
      setTimeout(() => {
        // Close transaction modal and start the game
        setTransactionModal({
          isOpen: false,
          status: "confirmed",
          title: "",
          message: "",
          transactionHash: undefined
        })
        
        // Now start the game after confirmation
        BetSound()
        setConfig(generateBoard())
        setStatus("in-progress")
        setCurrentRow(0)
        setSteps(0)
        setPopup({ isOpen: false, type: null })
        
        // Show success toast with transaction hash
        toast.success("Game started successfully!", {
          description: `Transaction: ${finalHash?.slice(0, 8)}...${finalHash?.slice(-6)}`,
          duration: 4000,
        })
        
        setSuccessMessage(`Game started!`)
      }, 1500)
    }
  }, [isConfirmed, transactionHash, contractTransactionHash, waitingForConfirmation])

  // Watch for transaction errors
  React.useEffect(() => {
    if (waitingForConfirmation && contractError) {
      setWaitingForConfirmation(false)
      
      // Show error in transaction modal
      setTransactionModal({
        isOpen: true,
        status: "failed",
        title: "Transaction Failed",
        message: contractError.message || "Transaction failed. Please try again.",
        transactionHash: transactionHash
      })
    }
  }, [contractError, waitingForConfirmation, transactionHash])

  React.useEffect(() => {
    if (difficulty === "Easy") setNumCols(4)
    if (difficulty === "Hard") setNumCols(5)
  }, [difficulty])

  function generateBoard(): RowConfig[] {
    const next: RowConfig[] = []
    const safePerRow = difficulty === "Easy" ? 2 : 1
    for (let r = 0; r < rows; r++) {
      const indices: number[] = []
      while (indices.length < safePerRow) {
        const candidate = Math.floor(Math.random() * numCols)
        if (!indices.includes(candidate)) indices.push(candidate)
      }
      next.push({ safeIndices: indices })
    }
    return next
  }

  const startGame = async () => {
    clearMessages()
    
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    // Validate bet amount first
    const bet = Number.parseFloat(betAmount)
    if (bet <= 0 || isNaN(bet)) {
      setErrorMessage("Please enter a valid bet amount")
      return
    }
    
    if (bet < 0.01) {
      setErrorMessage("Minimum bet amount is 0.01 CELO")
      return
    }
    
    try {
      const newGameId = `paaji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setGameId(newGameId)
      
        // Show transaction modal with engaging message
        setTransactionModal({
          isOpen: true,
          status: "pending",
          title: "Placing Your Bet",
          message: "Placing your bet on CELO Mainnet... hang tight!",
          transactionHash: undefined
        })
        
        // Start the contract transaction - this opens wallet for user to sign
        console.log('🚀 Starting Paaji contract game...');
        await startContractGame(newGameId, betAmount, "paaji")
        console.log('📝 Paaji contract game started, hash:', contractTransactionHash);
        
        // Set the transaction hash and start waiting for confirmation
        setTransactionHash(contractTransactionHash || "")
        setWaitingForConfirmation(true)
        
        console.log('⏳ Paaji waiting for confirmation...', {
          waitingForConfirmation: true,
          isConfirmed,
          contractTransactionHash
        });
        
        // Update modal with transaction hash and confirmation status
        setTransactionModal({
          isOpen: true,
          status: "confirming",
          title: "Confirming Transaction",
          message: "Your bet is being confirmed on the blockchain. This usually takes a few seconds.",
          transactionHash: contractTransactionHash || ""
        })
    } catch (error: any) {
      console.error("Error starting game:", error)
      let errorMsg = "Error starting game. Please try again."
      
      // @ts-ignore - best effort error message
      if (error.message?.includes("User closed the window")) {
        errorMsg = "Transaction cancelled. Please try again when ready."
      } else if (error.message?.includes("insufficient balance")) {
        errorMsg = "Insufficient balance. Please add more CELO to your wallet."
      } else if (error.message?.includes("already have a pending bet")) {
        errorMsg = "You already have a pending bet. Please wait for it to be resolved."
      } else if (error.message) {
        errorMsg = error.message
      }
      
      // Show error in transaction modal
      setTransactionModal({
        isOpen: true,
        status: "failed",
        title: "Transaction Failed",
        message: errorMsg,
        transactionHash: transactionModal.transactionHash
      })
    }
  }

  function resetGame() {
    setStatus("idle")
    setCurrentRow(0)
    setConfig([])
    setSteps(0)
    setPopup({ isOpen: false, type: null })
  }

  const cashOut = async () => {
    if (status === "in-progress") {
      // User is cashing out - automatically resolve
      console.log("💰 User cashing out with multiplier:", multiplier)
      
      setStatus("cashed-out")
      PaajiCashoutSound()
      
      // Resolve game directly
      resolveGame(true, parseFloat(multiplier))
    }
  }

  const pickTile = async (row: number, col: number) => {
    if (!canPlay) return
    if (row !== currentRow) return

    setConfig((prev) => {
      const next = [...prev]
      const rowCfg = { ...next[row], revealedIndex: col }
      next[row] = rowCfg
      return next
    })

    const isSafe = config[row]?.safeIndices?.includes(col) === true
    if (isSafe) {
      const nextRow = currentRow + 1
      setSteps((s) => s + 1)
      PaajiWinSound()
      if (nextRow >= rows) {
        setCurrentRow(nextRow)
        setStatus("won")
        PaajiCashoutSound()
        
        // User reached the top - resolve directly
        console.log("🏆 User reached the top with multiplier:", multiplier)
        resolveGame(true, parseFloat(multiplier))
      } else {
        setCurrentRow(nextRow)
      }
    } else {
      setStatus("lost")
      PaajiLoseSound()
      
      // Game lost - resolve directly
      console.log("💥 User hit wrong tile - game lost")
      resolveGame(false, 1.0)
    }
  }

  React.useEffect(() => {
    if (status === "lost") {
      setPopup({ isOpen: true, type: "lose" })
    }
    if (status === "won" || status === "cashed-out") {
      setPopup({ isOpen: true, type: "win" })
      
    }
  }, [status])

  React.useEffect(() => {
    if (!(popup.isOpen && popup.type === "win")) return

    const end = Date.now() + 3 * 1000
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
    let rafId: number
    let cancelled = false

    const frame = () => {
      if (cancelled) return
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      })

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [popup])

  const closePopup = () => setPopup({ isOpen: false, type: null })

  const adjustBetAmount = (factor: number) => {
    const current = Number.parseFloat(betAmount) || 0
    setBetAmount((current * factor).toFixed(2))
  }

  return (
    <div className="mx-auto max-w-6xl w-full pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Left control panel */}
        <div className="rounded-2xl border border-border bg-background/60 p-3 lg:p-4">
          <div className="space-y-3">

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-600/20 border border-red-500/30 rounded-4xl p-3 text-center">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ {errorMessage}
                </p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-600/20 border border-green-500/30 rounded-4xl p-3 text-center">
                <p className="text-green-400 text-sm font-medium">
                  ✅ {successMessage}
                </p>
              </div>
            )}


            {/* Game Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
              <button
                className="h-8 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
                aria-pressed={true}
              >
                Manual
              </button>
              <button className="h-8 rounded-lg text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-muted transition">
                Auto
              </button>
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Bet Amount</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                  <Input
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-transparent outline-none border-0 h-8 p-0"
                    placeholder="0.10"
                    disabled={status === "in-progress"}
                  />
                </div>
                <div className="text-xs text-muted-foreground px-2">
                  CELO
                </div>
                <button
                  onClick={() => adjustBetAmount(0.5)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={status === "in-progress"}
                >
                  ½
                </button>
                <button
                  onClick={() => adjustBetAmount(2)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={status === "in-progress"}
                >
                  2×
                </button>
              </div>
              <div className="mt-1 text-[11px] text-foreground/50">Min: 0.01 CELO</div>
            </div>

            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Difficulty</div>
              <div className="grid grid-cols-2 gap-2">
                {["Easy", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d as Difficulty)
                      resetGame()
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      difficulty === d
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-foreground/80 hover:bg-muted",
                    )}
                    aria-pressed={difficulty === d}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              {status !== "in-progress" ? (
                <Button 
                  className="w-full h-10 rounded-xl" 
                  onClick={startGame}
                  disabled={!isConnected || transactionModal.isOpen}
                >
                  {transactionModal.isOpen ? "⏳ Processing..." : "🎯 Start Game"}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="h-10 rounded-xl" onClick={cashOut}>
                    💰 Cash Out
                  </Button>
                  <Button variant="ghost" className="h-10 rounded-xl" onClick={resetGame}>
                    Reset
                  </Button>
                </div>
              )}
            </div>

            <div>
              <button className="w-full h-9 rounded-xl border border-border text-sm text-foreground/80 hover:bg-muted">
                Random Pick
              </button>
            </div>

            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Total Profit ({multiplier}×)</div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                <span className="text-foreground/60">
                  {status === "in-progress" || status === "cashed-out" || status === "won" 
                    ? formatGameCurrency((parseFloat(betAmount) * (parseFloat(multiplier) - 1)).toString())
                    : "0.00 CELO"
                  }
                </span>
              </div>
            </div>

            {/* Multiplier Progression Display */}
            {status === "in-progress" && (
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Multiplier Progression ({difficulty})</div>
                <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-background/40 p-2">
                  {(() => {
                    const easyMultipliers = [1.12, 1.36, 1.65, 1.95, 2.0, 2.4, 2.6, 3.0];
                    const hardMultipliers = [1.25, 1.56, 1.95, 2.2, 2.8, 3.5, 4.3, 5.0];
                    const multipliers = difficulty === "Easy" ? easyMultipliers : hardMultipliers;
                    
                    return multipliers.map((mult, index) => (
                      <div
                        key={index}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          index === steps 
                            ? "bg-primary text-primary-foreground" 
                            : index < steps 
                              ? "bg-green-500/20 text-green-600" 
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {mult.toFixed(2)}×
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground/80">
              {status === "idle" && "Press Bet to begin. Pick one tile per row from bottom to top."}
              {status === "in-progress" && `Row ${currentRow + 1} of ${rows}. Choose a safe tile.`}
              {status === "won" && `You reached the top! Final multiplier ${multiplier}x.`}
              {status === "lost" && "Boom! You hit a bomb. Try again."}
              {status === "cashed-out" && `You cashed out at ${steps} step${steps === 1 ? "" : "s"} • ${multiplier}x.`}
            </div>
          </div>
        </div>

        {/* Right board panel */}
        <div className="relative rounded-2xl border border-border bg-background/60 p-3 lg:p-5">
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/40" />

          <div className={cn("mx-auto", numCols === 3 && "max-w-[720px]", numCols === 4 && "max-w-[900px]", numCols >= 5 && "max-w-[1040px]")}>          
            <div className="rounded-2xl border border-border bg-background/30 p-3 sm:p-4">
              <div className="grid gap-3">
                {Array.from({ length: rows }).map((_, row) => {
                  const logicalRow = rows - 1 - row
                  const rowCfg = config[logicalRow]
                  const isActive = canPlay && logicalRow === currentRow
                  const isPast =
                    logicalRow < currentRow || status === "won" || status === "lost" || status === "cashed-out"
                  const locked = !isActive

                  return (
                    <div
                      key={row}
                      className={cn(
                        "grid gap-3",
                        numCols === 3 && "grid-cols-3",
                        numCols === 4 && "grid-cols-4",
                        numCols === 5 && "grid-cols-5",
                        numCols >= 6 && "grid-cols-6",
                        isActive && "rounded-xl ring-1 ring-primary/30 bg-primary/5 p-2 transition-colors"
                      )}
                      aria-label={`Row ${logicalRow + 1}`}
                    >
                      {Array.from({ length: numCols }).map((__, col) => {
                        const picked = rowCfg?.revealedIndex === col
                        const isSafe = rowCfg?.safeIndices?.includes(col) === true
                        const shouldReveal =
                          isPast || (rowCfg && typeof rowCfg.revealedIndex === "number" && (picked || status !== "in-progress"))

                        const showPaaji = shouldReveal && isSafe
                        const showBomb = shouldReveal && !isSafe

                        return (
                          <button
                            key={col}
                            disabled={locked}
                            onClick={() => pickTile(logicalRow, col)}
                            className={cn(
                              "relative aspect-[2.1/1] w-full overflow-hidden rounded-xl border",
                              isActive ? "border-primary/40 bg-primary/10 hover:bg-primary/15" : "border-border bg-background/60 hover:bg-muted/60",
                            )}
                            aria-label={isActive ? `Pick tile ${col + 1} in row ${logicalRow + 1}` : `Tile ${col + 1}`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              {showPaaji && (
                                <img
                                  src="/happypaaji.png"
                                  alt="Paaji"
                                  className="h-full w-full object-contain drop-shadow scale-110 sm:scale-125"
                                  crossOrigin="anonymous"
                                />
                              )}
                              {showBomb && (
                                <div className="size-10 rounded-full bg-destructive" aria-hidden title="Bomb" />
                              )}
                              {!showPaaji && !showBomb && (
                                <div className="h-full w-full opacity-[0.08]" />
                              )}
                            </div>
                            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-border/40" />
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Popup Modal */}
        {popup.isOpen && (
          <div onClick={closePopup} className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-background/60 backdrop-blur-xl border border-border rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
              <button type="button" onClick={closePopup} className="absolute top-4 right-4 z-10 pointer-events-auto text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                <X size={24} />
              </button>

              <div className="text-center space-y-3">
                {popup.type === "lose" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                      <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-destructive/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/sad-monkey.gif" alt="Loss" className="w-full h-full object-cover rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-destructive">BOOM! You Lost</h2>
                    <p className="text-foreground/70 text-base">Tough luck! Try a different path and go again.</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/nachoo.gif" alt="Win" className="w-full h-full object-contain rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-primary">Congratulations!</h2>
                    <p className="text-foreground/70 text-base">{status === "won" ? `You reached the top at ${multiplier}x!` : `You cashed out at ${multiplier}x after ${steps} step${steps === 1 ? "" : "s"}.`}</p>
                  </>
                )}

                <Button onClick={closePopup} className="w-full h-12 rounded-2xl font-semibold">
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={transactionModal.isOpen}
          onClose={() => setTransactionModal(prev => ({ ...prev, isOpen: false }))}
          status={transactionModal.status}
          title={transactionModal.title}
          message={transactionModal.message}
          transactionHash={transactionModal.transactionHash}
          explorerUrl={transactionModal.transactionHash ? getExplorerUrl(transactionModal.transactionHash) : undefined}
          showRetry={transactionModal.status === "failed"}
          showCancel={transactionModal.status === "pending" || transactionModal.status === "confirming"}
          onRetry={() => {
            setTransactionModal(prev => ({ ...prev, isOpen: false }))
            startGame()
          }}
          onCancel={() => {
            setTransactionModal(prev => ({ ...prev, isOpen: false }))
          }}
        />

      </div>
    </div>
  )
}

export default PaajiOnTop
