import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BoostThrottleState {
  guestBoostCount: number;
  sessionStart: number;
}

const GUEST_BOOST_LIMIT = 5;
const STORAGE_KEY = 'echo_guest_boosts';

export const useBoostThrottle = () => {
  const { isAuthenticated } = useAuth();
  const [throttleState, setThrottleState] = useState<BoostThrottleState>(() => {
    if (typeof window === 'undefined') return { guestBoostCount: 0, sessionStart: Date.now() };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Reset if session is older than 24 hours
        if (Date.now() - parsed.sessionStart > 24 * 60 * 60 * 1000) {
          const fresh = { guestBoostCount: 0, sessionStart: Date.now() };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          return fresh;
        }
        return parsed;
      } catch {
        const fresh = { guestBoostCount: 0, sessionStart: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
    }
    
    const fresh = { guestBoostCount: 0, sessionStart: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  });

  const canBoost = isAuthenticated || throttleState.guestBoostCount < GUEST_BOOST_LIMIT;
  const remainingBoosts = isAuthenticated ? Infinity : Math.max(0, GUEST_BOOST_LIMIT - throttleState.guestBoostCount);
  const isThrottled = !isAuthenticated && throttleState.guestBoostCount >= GUEST_BOOST_LIMIT;

  const consumeGuestBoost = () => {
    if (isAuthenticated) return; // Authenticated users don't have limits
    
    const newState = {
      ...throttleState,
      guestBoostCount: throttleState.guestBoostCount + 1
    };
    
    setThrottleState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const resetThrottle = () => {
    const fresh = { guestBoostCount: 0, sessionStart: Date.now() };
    setThrottleState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  // Reset throttle when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      resetThrottle();
    }
  }, [isAuthenticated]);

  return {
    canBoost,
    remainingBoosts,
    isThrottled,
    consumeGuestBoost,
    resetThrottle,
    isAuthenticated
  };
};