import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Season } from '@/types/admin';
import { toast } from 'sonner';

interface SeasonManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season: Season;
  onUpdateSeason: (seasonId: string, updates: Partial<Season>) => void;
  onEndSeason: (seasonId: string) => void;
}

export const SeasonManagementDialog = ({ 
  open, 
  onOpenChange, 
  season, 
  onUpdateSeason, 
  onEndSeason 
}: SeasonManagementDialogProps) => {
  const [endDate, setEndDate] = useState(
    new Date(season.endDate).toISOString().split('T')[0]
  );
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleUpdateEndDate = () => {
    const newEndDate = new Date(endDate);
    if (newEndDate <= new Date()) {
      toast.error("End date must be in the future");
      return;
    }
    
    onUpdateSeason(season.id, { endDate: newEndDate });
    toast.success("Season end date updated");
    onOpenChange(false);
  };

  const handleEndSeason = () => {
    onEndSeason(season.id);
    toast.success("Season ended successfully");
    onOpenChange(false);
    setShowEndConfirm(false);
  };

  if (showEndConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              End Season Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end "{season.title}" now? This action cannot be undone and will stop all new submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndSeason}>
              End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Season</DialogTitle>
          <DialogDescription>
            Update the end date or manually end "{season.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateEndDate} className="flex-1">
              Update
            </Button>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowEndConfirm(true)}
            className="w-full"
          >
            End
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
