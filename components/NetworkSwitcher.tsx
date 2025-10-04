"use client";

import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useToast } from '@/components/ui/Toast'

export default function NetworkSwitcher() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false);

  const toast = useToast()

  useEffect(() => {
    // Only switch if we're connected, not already on Sepolia, and haven't attempted switch yet
    if (isConnected && chain && chain.id !== sepolia.id && !hasAttemptedSwitch && !isPending) {
      console.log('🔄 Auto-switching to Sepolia network...', { currentChain: chain.name, currentId: chain.id });
      setHasAttemptedSwitch(true);
      toast.show({ title: 'Wrong network', description: `Please switch to Sepolia network. Current: ${chain.name}`, type: 'warning', duration: 5000 })

      switchChain({ chainId: sepolia.id })
        .then(() => {
          console.log('✅ Successfully switched to Sepolia');
          toast.show({ title: 'Switched network', description: 'Successfully switched to Sepolia', type: 'success', duration: 3000 })
        })
        .catch((error) => {
          console.error('❌ Could not auto-switch to Sepolia:', error.message);
          toast.show({ title: 'Network switch failed', description: String(error?.message || 'Failed to switch network'), type: 'error' })
          // Reset the flag so we can try again later
          setTimeout(() => setHasAttemptedSwitch(false), 5000);
        });
    }
  }, [chain, isConnected, switchChain, hasAttemptedSwitch, isPending, toast]);

  // Reset the flag when chain changes to Sepolia
  useEffect(() => {
    if (chain && chain.id === sepolia.id) {
      setHasAttemptedSwitch(false);
    }
  }, [chain]);

  // This component doesn't render anything
  return null;
}
