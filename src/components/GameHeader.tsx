import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SubmissionForm } from '@/components/SubmissionForm';
import { SubmissionPayload } from '@/types/submission';

interface GameHeaderProps {
  onSubmit: (submissionData: SubmissionPayload) => void;
  roomTitle?: string;
  roomDescription?: string;
  roomId?: string;
  seasonId?: string;
  seasonEndDate?: Date | string;
}

export const GameHeader = ({
  onSubmit,
  roomTitle = "Phonk Monsta",
  roomDescription = "Submit your hottest phonk tracks and boost the best ones!",
  roomId,
  seasonId,
  seasonEndDate,
}: GameHeaderProps) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [countdown, setCountdown] = React.useState<string>('');

  React.useEffect(() => {
    if (!seasonEndDate) {
      setCountdown('');
      return;
    }

    const targetTime = new Date(seasonEndDate).getTime();
    if (Number.isNaN(targetTime)) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setCountdown('Season ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [seasonEndDate]);

  const handleSubmit = (submissionData: SubmissionPayload) => {
    onSubmit(submissionData);
    setIsSubmitModalOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 animate-fade-in gap-4 px-4 sm:px-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src="/lovable-uploads/0a873264-46a5-463f-b516-c1482ac60070.png" alt="Echo" className="w-8 h-8 sm:w-10 sm:h-10 hover:scale-110 transition-transform duration-300 flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground text-gradient truncate">{roomTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{roomDescription}</p>
          {countdown && (
            <p className="text-xs text-muted-foreground font-mono mt-1 hover:text-primary transition-colors">
              {countdown === 'Season ended' ? countdown : `Season ends in ${countdown}`}
            </p>
          )}
        </div>
      </div>
      
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogTrigger asChild>
          <Button variant="transparent">
            <Plus className="w-4 h-4 mr-2" />
            Submit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Your Track</DialogTitle>
          </DialogHeader>
          <SubmissionForm
            onSubmit={handleSubmit}
            roomId={roomId}
            seasonId={seasonId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
