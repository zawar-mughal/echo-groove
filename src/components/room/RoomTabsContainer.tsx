import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaSubmission } from '@/types/submission';
import { Room } from '@/types/admin';
import { SubmissionsList } from '@/components/SubmissionsList';
import { RoomPlaylistView } from './RoomPlaylistView';
import { SongProfileModal } from '@/components/SongProfileModal';

interface RoomTabsContainerProps {
  room: Room;
  regularSubmissions: MediaSubmission[];
  trendingSubmission: MediaSubmission | null;
  onBoost: (id: string, userId?: string) => void;
  onPlay: (submissionId: string) => void;
  onRowClick: (submissionId: string) => void;
  currentlyPlaying: string | null;
  isPlaying: boolean;
  currentUserId: string;
  playlistSubmissions: MediaSubmission[]; // Songs in the room's curated playlist
  activeTab: 'season' | 'playlist';
}

export const RoomTabsContainer = ({
  room,
  regularSubmissions,
  trendingSubmission,
  onBoost,
  onPlay,
  onRowClick,
  currentlyPlaying,
  isPlaying,
  currentUserId,
  playlistSubmissions,
  activeTab
}: RoomTabsContainerProps) => {
  const [songProfileModal, setSongProfileModal] = useState<{
    submission: MediaSubmission | null;
    canBoost: boolean;
  }>({ submission: null, canBoost: false });

  const handleSongProfileClick = (submission: MediaSubmission, canBoost: boolean = false) => {
    setSongProfileModal({ submission, canBoost });
  };

  const closeSongProfile = () => {
    setSongProfileModal({ submission: null, canBoost: false });
  };

  return (
    <>
      {/* Content based on active tab */}
      {activeTab === 'season' ? (
        <SubmissionsList
          regularSubmissions={regularSubmissions}
          trendingSubmission={trendingSubmission}
          onBoost={onBoost}
          onPlay={onPlay}
          onRowClick={onRowClick}
          onMediaClick={(submissionId) => {
            const submission = [...regularSubmissions, ...(trendingSubmission ? [trendingSubmission] : [])]
              .find(s => s.id === submissionId);
            if (submission) {
              handleSongProfileClick(submission, true); // Can boost in current season
            }
          }}
          currentlyPlaying={currentlyPlaying}
          isPlaying={isPlaying}
          currentUserId={currentUserId}
        />
      ) : (
        <RoomPlaylistView
          room={room}
          playlistSubmissions={playlistSubmissions}
          onPlay={onPlay}
          onSongClick={(submission) => handleSongProfileClick(submission, false)} // Cannot boost in playlist view
          currentlyPlaying={currentlyPlaying}
          isPlaying={isPlaying}
        />
      )}

      <SongProfileModal
        submission={songProfileModal.submission}
        isOpen={!!songProfileModal.submission}
        onClose={closeSongProfile}
        onBoost={songProfileModal.canBoost ? onBoost : undefined}
        canBoost={songProfileModal.canBoost}
        onPlay={onPlay}
        isPlaying={songProfileModal.submission?.id === currentlyPlaying && isPlaying}
        roomSlug={room.slug}
      />
    </>
  );
};
