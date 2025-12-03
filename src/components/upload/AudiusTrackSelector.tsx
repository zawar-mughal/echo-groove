import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Upload, Music, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserAudiusTracks } from '@/hooks/api/useUserAudiusTracks';
import { useFilterAvailableTracksForRoom } from '@/hooks/api/useRoomSubmissionCheck';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { AudiusTrackCard } from './AudiusTrackCard';
import type { SelectableAudiusTrack } from '@/types/audius';
import { AudiusLinkButton } from '../auth/AudiusLinkButton';

interface AudiusTrackSelectorProps {
  roomId: string;
  seasonId?: string;
  onTrackSelect: (track: SelectableAudiusTrack) => void;
  onUploadNew: () => void;
  selectedTrackId?: string;
}

export const AudiusTrackSelector = ({
  roomId,
  seasonId,
  onTrackSelect,
  onUploadNew,
  selectedTrackId,
}: AudiusTrackSelectorProps) => {
  const { audiusUser, isAudiusLinked } = useAudiusAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch user's Audius tracks
  const {
    data: userTracks,
    isLoading: isLoadingTracks,
    error: tracksError,
  } = useUserAudiusTracks(audiusUser?.userId);

  // Filter tracks to exclude already-submitted ones
  const {
    data: selectableTracks,
    isLoading: isFilteringTracks,
  } = useFilterAvailableTracksForRoom(roomId, userTracks);

  // Client-side search filtering
  const filteredTracks = useMemo(() => {
    if (!selectableTracks) return [];

    if (!debouncedSearch.trim()) {
      return selectableTracks;
    }

    const query = debouncedSearch.toLowerCase();
    return selectableTracks.filter(
      track =>
        track.title.toLowerCase().includes(query) ||
        track.user.name.toLowerCase().includes(query) ||
        track.genre?.toLowerCase().includes(query) ||
        track.tags?.toLowerCase().includes(query)
    );
  }, [selectableTracks, debouncedSearch]);

  // Count available vs already submitted
  const availableCount = filteredTracks.filter(t => t.canSubmit).length;
  const submittedCount = filteredTracks.filter(t => t.isAlreadySubmitted).length;

  const isLoading = isLoadingTracks || isFilteringTracks;

  // Not linked to Audius
  if (!isAudiusLinked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Music className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Link Your Audius Account</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          To submit tracks, you need to link your Audius account. This allows you to
          upload music and select from your existing tracks.
        </p>
        <AudiusLinkButton variant="default" size="lg" />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-echo-primary" />
        <p className="text-sm text-muted-foreground">Loading your Audius tracks...</p>
      </div>
    );
  }

  // Error state
  if (tracksError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load your Audius tracks. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // No tracks uploaded
  if (!userTracks || userTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Upload className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Tracks Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          You haven't uploaded any tracks to Audius yet. Upload a new track to get
          started!
        </p>
        <Button onClick={onUploadNew} size="lg">
          <Upload className="w-4 h-4 mr-2" />
          Upload New Track
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Select a Track</h3>
            <p className="text-sm text-muted-foreground">
              Choose from your Audius library or upload a new track
            </p>
          </div>
          <Button onClick={onUploadNew} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {availableCount} available · {submittedCount} already submitted
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, artist, or genre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Track List */}
      {filteredTracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No tracks found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pr-4">
            {filteredTracks.map(track => (
              <AudiusTrackCard
                key={track.id}
                track={track}
                onSelect={onTrackSelect}
                isSelected={selectedTrackId === track.id}
                showSelectButton
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer CTA */}
      {filteredTracks.length > 0 && availableCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All your tracks have already been submitted to this room. Upload a new
            track to participate!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
