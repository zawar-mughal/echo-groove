import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MediaSubmission } from '@/types/submission';
import { useAudiusStream } from '@/hooks/useAudiusStream';

interface NativeAudioPlayerProps {
  submission: MediaSubmission;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTrackEnd: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const NativeAudioPlayer = ({
  submission,
  isPlaying,
  onPlayPause,
  onTrackEnd,
  onTimeUpdate
}: NativeAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);

  const shouldFetchAudiusStream =
    submission.provider === 'audius' && !!submission.provider_track_id;

  const { data: audiusStreamUrl, isLoading: isAudiusLoading } = useAudiusStream(
    shouldFetchAudiusStream ? submission.provider_track_id : undefined
  );

  // Cache locally uploaded file URLs
  useEffect(() => {
    if (submission.audioFile) {
      const url = URL.createObjectURL(submission.audioFile);
      setLocalAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setLocalAudioUrl(null);
      };
    }
    setLocalAudioUrl(null);
  }, [submission.audioFile]);

  const fallbackExternalLink = submission.externalLink;

  const resolvedAudioSrc =
    audiusStreamUrl ||
    submission.audioUrl ||
    fallbackExternalLink ||
    localAudioUrl ||
    undefined;

  // Attach audio source when it becomes available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (resolvedAudioSrc) {
      if (audio.src !== resolvedAudioSrc) {
        audio.src = resolvedAudioSrc;
        audio.load();
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      setIsBuffering(false);
    }
  }, [resolvedAudioSrc]);

  // Control playback based on isPlaying prop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !resolvedAudioSrc) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, resolvedAudioSrc]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsBuffering(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    
    const handleEnded = () => {
      setCurrentTime(0);
      onTrackEnd();
    };

    const handleError = () => {
      setIsBuffering(false);
      console.error('Audio loading error');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onTrackEnd, onTimeUpdate]);

  // Volume control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLoading = isBuffering || (shouldFetchAudiusStream && isAudiusLoading);

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-lg shadow-2xl overflow-hidden">
      {/* Cover Art */}
      <div className="flex flex-col items-center p-8">
        {submission.coverArt && (
          <img
            src={submission.coverArt}
            alt={submission.title}
            className="w-64 h-64 object-cover rounded-lg shadow-lg mb-6"
          />
        )}
        
        {/* Track Info */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-foreground">{submission.title}</h2>
          <p className="text-lg text-muted-foreground">{submission.creator}</p>
        </div>

        {!resolvedAudioSrc && !isLoading && (
          <p className="text-sm text-muted-foreground mb-4 text-center w-full">
            Audio source unavailable for this submission.
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full space-y-2 mb-4">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={!resolvedAudioSrc || !duration}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={onPlayPause}
            disabled={isLoading || !resolvedAudioSrc}
            size="lg"
            className="w-12 h-12 rounded-full"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-full max-w-32">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          preload="metadata"
          className="hidden"
        />
      </div>
    </div>
  );
};
