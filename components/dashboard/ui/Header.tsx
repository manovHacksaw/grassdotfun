"use client"

import ConnectWalletButton from "@/components/wallet/ConnectWalletButton"
import { useEffect, useState } from "react"
import { useWagmiWallet } from "@/contexts/WagmiWalletContext"
import AppSidebar from "@/components/dashboard/ui/SidebarTabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardHeaderProps {
  title?: string
  balanceInNEAR: number
}

export default function DashboardHeader({ title = "Grass", balanceInNEAR }: DashboardHeaderProps) {
  const { isConnected, balance } = useWagmiWallet()

  return (
    <TooltipProvider>
      <AppSidebar />

      {/* make header transparent, fully rounded, and offset from left to clear the sidebar.
          Small inset top/right so the curve is visible. */}
      <header
        className="fixed top-0 right-80 left-[16rem] z-50 rounded-full border border-border bg-background/70 backdrop-blur"
        aria-label="Main header"
      >
        <div className="relative mx-auto flex h-14 items-center justify-end px-2 md:px-3">
          {/* Right: Network indicator, Wallet connect */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* U2U Solaris Mainnet Network Badge */}
            <Badge 
              variant="outline" 
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="hidden sm:inline">U2U Solaris Mainnet</span>
                <span className="sm:hidden">U2U</span>
              </div>
            </Badge>

            <ConnectWalletButton />
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
