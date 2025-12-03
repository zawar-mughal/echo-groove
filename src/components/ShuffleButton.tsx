import React from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle, Pause } from 'lucide-react';

interface ShuffleButtonProps {
  onShuffle: () => void;
  mode: 'modal' | 'inline';
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  isActive?: boolean;
}

export const ShuffleButton = ({
  onShuffle,
  mode,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  isActive = false
}: ShuffleButtonProps) => {
  // Always show "Shuffle" label, use visual indicator for active state
  const activeVariant = isActive ? 'default' : variant;

  return (
    <Button
      onClick={onShuffle}
      variant={activeVariant}
      size={size}
      disabled={disabled}
      className={`flex items-center gap-2 ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <Shuffle className="w-4 h-4" />
      Shuffle
    </Button>
  );
};
