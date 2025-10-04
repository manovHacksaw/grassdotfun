"use client";

import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useToast } from '@/components/ui/Toast'

export default function NetworkSwitcher() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false);

  useEffect(() => {
    // Only switch if we're connected, not already on Sepolia, and haven't attempted switch yet
    if (isConnected && chain && chain.id !== sepolia.id && !hasAttemptedSwitch && !isPending) {
      console.log('🔄 Auto-switching to Sepolia network...', { currentChain: chain.name, currentId: chain.id });
      setHasAttemptedSwitch(true);
      
      switchChain({ chainId: sepolia.id })
        .then(() => {
          console.log('✅ Successfully switched to Sepolia');
        })
        .catch((error) => {
          console.error('❌ Could not auto-switch to Sepolia:', error.message);
          // Reset the flag so we can try again later
          setTimeout(() => setHasAttemptedSwitch(false), 5000);
        });
    }
  }, [chain, isConnected, switchChain, hasAttemptedSwitch, isPending]);

  // Reset the flag when chain changes to Sepolia
  useEffect(() => {
    if (chain && chain.id === sepolia.id) {
      setHasAttemptedSwitch(false);
    }
  }, [chain]);

  // This component doesn't render anything
  return null;
}
