import React, { useMemo } from 'react';
import { MediaSubmission } from '@/types/submission';
import { Room } from '@/types/admin';
import { PlaylistTrackItem } from './PlaylistTrackItem';

interface RoomPlaylistViewProps {
  room: Room;
  playlistSubmissions: MediaSubmission[];
  onPlay: (submissionId: string) => void;
  onSongClick: (submission: MediaSubmission) => void;
  currentlyPlaying: string | null;
  isPlaying: boolean;
}

const RoomPlaylistViewComponent = ({
  room,
  playlistSubmissions,
  onPlay,
  onSongClick,
  currentlyPlaying,
  isPlaying
}: RoomPlaylistViewProps) => {
  // Memoize the playlist items to prevent re-renders when parent re-renders
  const playlistItems = useMemo(() => {
    return playlistSubmissions.map((submission, index) => (
      <PlaylistTrackItem
        key={submission.id}
        submission={submission}
        trackNumber={index + 1}
        onPlay={onPlay}
        onSongClick={onSongClick}
        currentlyPlaying={currentlyPlaying}
        isPlaying={isPlaying}
      />
    ));
  }, [playlistSubmissions, onPlay, onSongClick, currentlyPlaying, isPlaying]);
  return (
    <div className="space-y-4">
      {/* Playlist Items */}
      {playlistSubmissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tracks in this room's playlist yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playlistItems}
        </div>
      )}
    </div>
  );
};

export const RoomPlaylistView = React.memo(RoomPlaylistViewComponent, (prevProps, nextProps) => {
  // Only re-render if relevant props changed
  return (
    prevProps.currentlyPlaying === nextProps.currentlyPlaying &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.playlistSubmissions === nextProps.playlistSubmissions &&
    prevProps.room.id === nextProps.room.id
  );
});