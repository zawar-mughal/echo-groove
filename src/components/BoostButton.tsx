import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBoostThrottle } from '@/hooks/useBoostThrottle';
import { EchoLoginModal } from '@/components/auth/EchoLoginModal';

interface BoostButtonProps {
  onBoost: () => void;
  boostCount: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'trending' | 'modal';
  className?: string;
}

export const BoostButton = ({ 
  onBoost, 
  boostCount, 
  size = 'md', 
  variant = 'default',
  className 
}: BoostButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { canBoost, remainingBoosts, isThrottled, consumeGuestBoost, isAuthenticated } = useBoostThrottle();

  const handleBoost = () => {
    if (!canBoost) {
      setShowLoginModal(true);
      return;
    }

    setIsAnimating(true);
    consumeGuestBoost();
    onBoost();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const variantClasses = {
    default: 'bg-gradient-to-br from-secondary to-orange-600 hover:from-secondary/90 hover:to-orange-600/90 hover:shadow-orange-500/25',
    trending: 'bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/30 hover:shadow-red-500/40',
    modal: 'bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 hover:shadow-primary/25'
  };

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-foreground">
            {boostCount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {isThrottled ? 'login to boost' : 
             !isAuthenticated && remainingBoosts <= 3 ? `${remainingBoosts} left` : 'boosts'}
          </div>
        </div>
        
        <Button
          onClick={handleBoost}
          className={cn(
            sizeClasses[size],
            "boost-button rounded-full text-white transition-all duration-200 shadow-lg hover:shadow-xl",
            isThrottled ? "bg-muted hover:bg-muted" : variantClasses[variant],
            isAnimating && "animate-boost-pulse scale-110",
            variant === 'trending' && !isThrottled && "hover:scale-110 animate-rise-glow",
            variant === 'default' && !isThrottled && "hover:scale-105",
            isThrottled && "opacity-60",
            className
          )}
          title={isThrottled ? "Sign in to keep boosting" : "Boost this submission"}
        >
          {isThrottled ? <Lock className={iconSizes[size]} /> : <TrendingUp className={iconSizes[size]} />}
        </Button>
      </div>

      <EchoLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Keep Boosting!"
        subtitle="Sign in with Echo to get unlimited voting power"
      />
    </>
  );
};