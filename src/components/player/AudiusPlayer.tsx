import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Loader2, ExternalLink } from 'lucide-react';
import { useAudiusTrack } from '@/hooks/api/useUserAudiusTracks';
import { useAudiusStream } from '@/hooks/useAudiusStream';
import { formatDuration, getThumbnailArtwork, buildAudiusTrackUrl } from '@/lib/audiusHelpers';

interface AudiusPlayerProps {
  trackId: string;
  autoPlay?: boolean;
  showArtwork?: boolean;
  compact?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const AudiusPlayer = ({
  trackId,
  autoPlay = false,
  showArtwork = true,
  compact = false,
  onPlayStateChange,
}: AudiusPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch track metadata
  const { data: track, isLoading: isLoadingTrack } = useAudiusTrack(trackId);

  // Fetch stream URL
  const { data: streamUrl, isLoading: isLoadingStream } = useAudiusStream(trackId);

  // Update audio source when stream URL is available
  useEffect(() => {
    if (audioRef.current && streamUrl) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();

      if (autoPlay) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [streamUrl, autoPlay]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [onPlayStateChange]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const artworkUrl = getThumbnailArtwork(track?.artwork);
  const audiusUrl = track ? buildAudiusTrackUrl(track.user.handle, track.title) : '';

  if (isLoadingTrack || isLoadingStream) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-echo-primary" />
        </div>
      </Card>
    );
  }

  if (!track || !streamUrl) {
    return (
      <Card className="p-4">
        <div className="text-center text-sm text-muted-foreground py-4">
          Failed to load track
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 w-full">
        <audio ref={audioRef} />

        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <audio ref={audioRef} />

      <div className="flex gap-4 p-4">
        {/* Artwork */}
        {showArtwork && (
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Player Controls */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Track Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{track.title}</h4>
              <p className="text-sm text-muted-foreground truncate">{track.user.name}</p>
            </div>
            <a
              href={audiusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-2"
            >
              <Button size="sm" variant="ghost">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause */}
            <Button
              size="lg"
              onClick={togglePlayPause}
              disabled={isLoading}
              className="bg-gradient-to-r from-echo-primary to-echo-secondary"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
