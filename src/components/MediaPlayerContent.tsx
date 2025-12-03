import React from 'react';
import { MediaSubmission } from '@/types/submission';
import { NativeAudioPlayer } from '@/components/NativeAudioPlayer';

interface MediaPlayerContentProps {
  submission: MediaSubmission;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTrackEnd: () => void;
}

export const MediaPlayerContent = ({ submission, isPlaying, onPlayPause, onTrackEnd }: MediaPlayerContentProps) => {

  const renderNativePlayer = () => {
    // All submissions are now Audius-based audio tracks
    return (
      <NativeAudioPlayer
        submission={submission}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onTrackEnd={onTrackEnd}
      />
    );
  };


  return (
    <div className="flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 h-[calc(90vh-120px)] sm:h-[calc(90vh-140px)] p-4">
      {renderNativePlayer()}
    </div>
  );
};