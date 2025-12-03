import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="space-y-2">
      <Label>Upload Progress</Label>
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground">{progress}% complete</p>
    </div>
  );
};
