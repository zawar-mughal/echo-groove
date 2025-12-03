import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MediaSubmission } from '@/types/submission';
import { useAudiusStream } from '@/hooks/useAudiusStream';
import { formatDuration } from '@/lib/audiusHelpers';

interface GlobalAudioPlayerProps {
  submission: MediaSubmission | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTrackEnd: () => void;
  onSkipNext?: () => void;
  onSubmissionClick?: () => void;
}

export const GlobalAudioPlayer = ({
  submission,
  isPlaying,
  onPlayPause,
  onTrackEnd,
  onSkipNext,
  onSubmissionClick,
}: GlobalAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get Audius stream URL for Audius providers
  const trackId = submission?.provider === 'audius' ? submission.provider_track_id : null;
  const { data: streamUrl, isLoading: isLoadingStream } = useAudiusStream(trackId || '');

  // Get audio source URL
  const getAudioSrc = () => {
    if (!submission) return null;

    // For Audius submissions, use the stream URL from the hook
    if (submission.provider === 'audius' && streamUrl) {
      return streamUrl;
    }

    // For other providers or fallback
    if (submission.externalLink) {
      return submission.externalLink;
    }

    return submission.audioUrl || null;
  };

  const audioSrc = getAudioSrc();

  // Update audio source when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    audio.src = audioSrc;
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  }, [audioSrc]);

  // Control playback based on isPlaying prop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

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
  }, [isPlaying, audioSrc]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      onTrackEnd();
    };

    const handleError = () => {
      setIsLoading(false);
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
  }, [onTrackEnd]);

  // Volume controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Don't render if no submission
  if (!submission) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <audio ref={audioRef} />

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onSubmissionClick}
          >
            {submission.thumbnail ? (
              <img
                src={submission.thumbnail}
                alt={submission.title}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{submission.title}</p>
              <p className="text-xs text-muted-foreground truncate">{submission.creator}</p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPlayPause}
                disabled={isLoading || isLoadingStream}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              {onSkipNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSkipNext}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-12 text-right">
                {formatDuration(currentTime)}
              </span>
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Volume Controls */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end max-w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
