import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { GameHeader } from '@/components/GameHeader';
import { GameStats } from '@/components/GameStats';
import { RoomTabsContainer } from '@/components/room/RoomTabsContainer';
import { MediaPlayer } from '@/components/MediaPlayer';
import { useModalPlayer } from '@/hooks/useModalPlayer';
import { sortSubmissions, getCompetingCount } from '@/utils/submissionSorting';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRoomBySlug } from '@/hooks/api/useRooms';
import { useActiveSeason } from '@/hooks/api/useSeasons';
import { useSubmissions, useCreateSubmission } from '@/hooks/api/useSubmissions';
import { useAddBoost } from '@/hooks/api/useBoosts';
import { useBoostThrottle } from '@/hooks/useBoostThrottle';
import { useAudiusStream } from '@/hooks/useAudiusStream';
import type { MediaSubmission, SubmissionPayload } from '@/types/submission';
import type { Room as AdminRoom } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Calendar } from 'lucide-react';
import { useRoomPlaylist } from '@/hooks/api/usePlaylists';
import { mapSubmissionRecordToMediaSubmission } from '@/utils/submissionMapper';
import { EchoLoginModal } from '@/components/auth/EchoLoginModal';

export default function Room() {
  const { roomId: roomSlug } = useParams<{ roomId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'season' | 'playlist'>('season');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const handledSharedTrack = useRef<string | null>(null);
  const isTransitioning = useRef(false);
  const lastLoadedSource = useRef<string>('');

  // Fetch real data from Supabase - roomSlug is actually a slug, not a UUID
  const { data: room, isLoading: roomLoading, error: roomError, refetch: refetchRoom } = useRoomBySlug(roomSlug);
  const { data: season, isLoading: seasonLoading, error: seasonError, refetch: refetchSeason } = useActiveSeason(room?.id);
  const { data: submissions = [], isLoading: submissionsLoading } = useSubmissions(season?.id);
  const { data: playlistData } = useRoomPlaylist(room?.id);
  const playlistSubmissions: MediaSubmission[] = useMemo(
    () => playlistData?.tracks.map((track) => track.submission) ?? [],
    [playlistData]
  );
  const [playlistShuffleActive, setPlaylistShuffleActive] = useState(false);
  const addBoost = useAddBoost();
  const { canBoost, consumeGuestBoost } = useBoostThrottle();
  const createSubmission = useCreateSubmission();

  // Convert database submissions to MediaSubmission format for UI compatibility
  const mediaSubmissions: MediaSubmission[] = useMemo(
    () => submissions.map(mapSubmissionRecordToMediaSubmission),
    [submissions]
  );

  const { regular: regularSubmissions, trending: trendingSubmission } = sortSubmissions(mediaSubmissions);
  const competingCount = getCompetingCount(mediaSubmissions);
  const seasonSubmissions = useMemo(
    () => [...regularSubmissions, ...(trendingSubmission ? [trendingSubmission] : [])],
    [regularSubmissions, trendingSubmission]
  );
  const allSubmissions = useMemo(() => {
    const map = new Map<string, MediaSubmission>();
    seasonSubmissions.forEach(submission => map.set(submission.id, submission));
    playlistSubmissions.forEach(submission => map.set(submission.id, submission));
    return Array.from(map.values());
  }, [playlistSubmissions, seasonSubmissions]);
  const seasonShuffleIds = useMemo(
    () => seasonSubmissions.map(submission => submission.id),
    [seasonSubmissions]
  );

  const sharedTrackId = useMemo(
    () => new URLSearchParams(location.search).get('track'),
    [location.search]
  );

  // IMPORTANT: Call useModalPlayer before any conditional returns to maintain consistent hook order
  const {
    state: modalState,
    toggleModal,
    startPlayback,
    pausePlayback,
    setIsPlaying,
    toggleShuffle,
    disableShuffle,
    playNextRandom,
    setVisibleModal
  } = useModalPlayer(allSubmissions, {
    shufflePoolIds: seasonShuffleIds,
  });

  const activeSubmission = allSubmissions.find(s => s.id === modalState.activePlayer);
  const { data: streamUrl } = useAudiusStream(activeSubmission?.provider === 'audius' ? activeSubmission?.provider_track_id : undefined);

  // Stabilize the audio URL values to prevent unnecessary reference changes
  const audioUrl = activeSubmission?.audioUrl;
  const externalLink = activeSubmission?.externalLink;

  // Memoize audio source to prevent unnecessary effect triggers
  const inlineAudioSource = useMemo(() => {
    return streamUrl || audioUrl || externalLink || undefined;
  }, [streamUrl, audioUrl, externalLink]);

  // Handle inline audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (modalState.activePlayer && inlineAudioSource) {
      // Only update src if it's different from the last loaded source
      if (lastLoadedSource.current !== inlineAudioSource) {
        isTransitioning.current = true;
        lastLoadedSource.current = inlineAudioSource;
        audio.src = inlineAudioSource;
        audio.load();

        // Clear transition flag when loaded
        const handleCanPlay = () => {
          isTransitioning.current = false;
        };
        audio.addEventListener('canplay', handleCanPlay, { once: true });
      }

      // Prevent redundant play/pause calls and avoid calling during transitions
      if (!isTransitioning.current) {
        if (modalState.isPlaying) {
          if (audio.paused && audio.readyState >= 2) {
            audio.play().catch(console.error);
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
        }
      }
    } else {
      // Clear playback when no active player
      if (!audio.paused) {
        audio.pause();
      }
      if (audio.src) {
        lastLoadedSource.current = '';
        audio.src = '';
      }
    }
  }, [modalState.activePlayer, modalState.isPlaying, inlineAudioSource]);

  // Consolidated playlist shuffle management - disable when conditions aren't met
  useEffect(() => {
    if (!playlistShuffleActive) return;

    const shouldDisable =
      !modalState.isPlaying || // Playback stopped
      modalState.shuffleEnabled || // Season shuffle enabled
      playlistSubmissions.length === 0 || // No playlist tracks
      activeTab === 'season'; // Switched to season tab

    if (shouldDisable) {
      setPlaylistShuffleActive(false);
    }
  }, [modalState.isPlaying, modalState.shuffleEnabled, playlistSubmissions.length, activeTab, playlistShuffleActive]);

  const getRandomPlaylistTrack = useCallback(
    (excludeId?: string | null) => {
      if (playlistSubmissions.length === 0) return null;
      const pool = excludeId
        ? playlistSubmissions.filter(submission => submission.id !== excludeId)
        : playlistSubmissions;
      const candidates = pool.length > 0 ? pool : playlistSubmissions;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex] ?? null;
    },
    [playlistSubmissions]
  );

  const handleTrackEnd = useCallback(() => {
    if (modalState.shuffleEnabled) {
      playNextRandom();
      return;
    }

    if (playlistShuffleActive) {
      const nextSubmission = getRandomPlaylistTrack(modalState.activePlayer);
      if (nextSubmission) {
        if (nextSubmission.id === modalState.activePlayer) {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
          }
        } else {
          startPlayback(nextSubmission.id, false);
        }
      } else {
        setPlaylistShuffleActive(false);
      }
    }
  }, [
    audioRef,
    getRandomPlaylistTrack,
    modalState.activePlayer,
    modalState.shuffleEnabled,
    playNextRandom,
    playlistShuffleActive,
    startPlayback,
  ]);

  useEffect(() => {
    if (!sharedTrackId) {
      handledSharedTrack.current = null;
      return;
    }

    if (handledSharedTrack.current === sharedTrackId) return;
    if (allSubmissions.length === 0) return;
    const exists = allSubmissions.some(submission => submission.id === sharedTrackId);
    if (!exists) return;

    setVisibleModal(sharedTrackId);
    handledSharedTrack.current = sharedTrackId;
  }, [allSubmissions, setVisibleModal, sharedTrackId]);

  useEffect(() => {
    const currentTrack = new URLSearchParams(location.search).get('track');
    const visibleTrackId = modalState.visibleModal;

    if (visibleTrackId) {
      if (currentTrack === visibleTrackId) {
        return;
      }
      const params = new URLSearchParams(location.search);
      params.set('track', visibleTrackId);
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
      return;
    }

    if (!visibleTrackId && currentTrack) {
      if (handledSharedTrack.current === null) {
        return;
      }
      const params = new URLSearchParams(location.search);
      params.delete('track');
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, modalState.visibleModal, navigate]);

  // Loading and error states - check these AFTER all hooks are called
  const isLoading = roomLoading || seasonLoading || submissionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading room...</div>
        </div>
      </div>
    );
  }

  // Error states
  if (roomError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4">
        <ErrorState
          title="Failed to Load Room"
          message="We couldn't load this room. Please check your connection and try again."
          onRetry={() => refetchRoom()}
        />
      </div>
    );
  }

  if (!room) {
    return <Navigate to="/" />;
  }

  if (seasonError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4">
        <ErrorState
          title="Failed to Load Season"
          message="We couldn't load the season information. Please try again."
          onRetry={() => refetchSeason()}
        />
      </div>
    );
  }

  // No active season - show empty state
  const noActiveSeason = !season && !seasonLoading;

  // Adapt database room to Room type for components
  const adaptedRoom: AdminRoom = {
    id: room.id,
    title: room.title,
    description: room.description || '',
    slug: room.slug,
    playlist: [], // TODO: Keep for backwards compatibility
     discordChannelId: room.discord_channel_id,
     discordGuildId: room.discord_guild_id,
    activeSeasonId: season?.id || '',
    createdBy: room.created_by || '',
    moderators: room.moderator_ids || [],
    isActive: room.is_active,
    isPublic: room.is_public,
    allowSubmissions: room.allow_submissions,
    createdAt: new Date(room.created_at),
    stats: {
      totalSubmissions: room.total_submissions,
      totalSeasons: room.total_seasons,
      totalMembers: room.total_members
    }
  };
  
  // Calculate playlist metadata
  const playlistDuration = playlistSubmissions.reduce((total, sub) => total + (sub.duration || 0), 0);
  const playlistDurationMinutes = Math.round(playlistDuration / 60);
  const playlistSeasons = playlistData
    ? new Set(playlistData.tracks.map(track => track.seasonId).filter(Boolean)).size
    : 0;

  const handleBoost = async (submissionId: string, userId: string) => {
    if (!season) return;

    // Check throttle for anonymous users
    if (!canBoost) {
      setShowLoginModal(true);
      return;
    }

    try {
      // Anonymous users: just track locally, don't hit database
      if (!user) {
        consumeGuestBoost();
        // Anonymous boosts are tracked in localStorage only
        // They won't persist or earn points until user logs in
        return;
      }

      // Authenticated users: add boost to database
      await addBoost.mutateAsync({
        submissionId,
        userId: user.id,
        seasonId: season.id,
      });
    } catch (error) {
      console.error('Failed to boost submission:', error);
    }
  };

  const handleSubmission = async (submissionData: SubmissionPayload) => {
    if (!user || !season || !room?.id) {
      toast({
        title: "Cannot submit",
        description: "You must be logged in and have an active season",
        variant: "destructive"
      });
      return;
    }

    try {
      const dbPayload = {
        season_id: season.id,
        room_id: room.id,
        user_id: user.id,
        title: submissionData.title,
        media_type: submissionData.mediaType || 'audio',
        provider: submissionData.provider || 'audius',
        external_url: submissionData.externalLink || submissionData.url,
        provider_track_id: submissionData.provider_track_id,
        thumbnail_path: submissionData.coverArt || submissionData.thumbnail,  // Changed from thumbnail_url to thumbnail_path
        description: submissionData.description,
        duration_seconds: submissionData.duration,
      };

      console.log('[Room] Creating submission with payload:', {
        ...dbPayload,
        submissionData_coverArt: submissionData.coverArt,
        submissionData_thumbnail: submissionData.thumbnail
      });

      await createSubmission.mutateAsync(dbPayload);

      toast({
        title: "Track submitted!",
        description: "Your track has been added to the season",
      });
    } catch (error) {
      console.error('Failed to create submission:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your track",
        variant: "destructive"
      });
    }
  };

  const handleThumbnailPlay = (submissionId: string) => {
    setPlaylistShuffleActive(false);
    // Play inline without opening modal
    if (modalState.activePlayer === submissionId && modalState.isPlaying) {
      pausePlayback();
    } else {
      startPlayback(submissionId, false); // false = don't show modal, play inline
      // TODO: Track play count in database
    }
  };

  const handleRowClick = (submissionId: string) => {
    // Open detail modal on row click
    toggleModal(submissionId);
  };

  const handlePlaylistShuffle = () => {
    if (playlistSubmissions.length === 0) return;

    if (playlistShuffleActive) {
      pausePlayback();
      setPlaylistShuffleActive(false);
      return;
    }

    disableShuffle();
    const nextSubmission = getRandomPlaylistTrack(modalState.activePlayer);
    if (nextSubmission) {
      startPlayback(nextSubmission.id, false);
      setPlaylistShuffleActive(true);
    }
  };

  const handleSeasonShuffleToggle = () => {
    setPlaylistShuffleActive(false);
    toggleShuffle();
  };

  if (noActiveSeason) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{room.title}</h1>
            {room.description && (
              <p className="text-muted-foreground">{room.description}</p>
            )}
          </div>

          <div className="flex items-center justify-center py-16">
            <EmptyState
              icon={Calendar}
              title="No Active Season"
              description="This room doesn't have an active season yet. Seasons are battle periods where users submit tracks and compete for boosts. Check back soon or contact the room admin to start a new season!"
              actionLabel={profile?.is_admin ? "Go to Admin Panel" : undefined}
              onAction={profile?.is_admin ? () => navigate('/admin') : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <GameHeader
          onSubmit={handleSubmission}
          roomTitle={room.title}
          roomDescription={room.description || ''}
          roomId={room.id}
          seasonId={season?.id}
          seasonEndDate={season?.end_date || season?.endDate}
        />

        {/* Tabs above stats */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'season' | 'playlist')} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-2 mx-4 sm:mx-0">
            <TabsTrigger value="season">Current Season</TabsTrigger>
            <TabsTrigger value="playlist">Room Playlist</TabsTrigger>
          </TabsList>
        </Tabs>

        <GameStats
          gameState={{
            submissions: mediaSubmissions,
            totalPlayers: season?.participant_count || 0,
            sessionStarted: season ? new Date(season.start_date) : new Date(),
            phase: 'voting' as const
          }}
          competingCount={competingCount}
          showShuffle={true}
          onShuffle={activeTab === 'season' ? handleSeasonShuffleToggle : handlePlaylistShuffle}
          shuffleActive={activeTab === 'season' ? modalState.shuffleEnabled : playlistShuffleActive}
          mode={activeTab}
          playlistStats={{
            trackCount: playlistSubmissions.length,
            durationMinutes: playlistDurationMinutes,
            seasonsCount: playlistSeasons
          }}
        />

        <RoomTabsContainer
          room={adaptedRoom}
          regularSubmissions={regularSubmissions}
          trendingSubmission={trendingSubmission}
          onBoost={handleBoost}
          onPlay={handleThumbnailPlay}
          onRowClick={handleRowClick}
          currentlyPlaying={modalState.activePlayer}
          isPlaying={modalState.isPlaying}
          currentUserId={user?.id || 'guest'}
          playlistSubmissions={playlistSubmissions}
          activeTab={activeTab}
        />
        
        <MediaPlayer
          submission={modalState.visibleModal ? allSubmissions.find(s => s.id === modalState.visibleModal) || null : null}
          submissions={allSubmissions}
          isOpen={!!modalState.visibleModal}
          onClose={() => setVisibleModal(null)}
          isPlaying={modalState.isPlaying && modalState.activePlayer === modalState.visibleModal}
          onPlayToggle={() => {
            if (modalState.visibleModal) {
              if (modalState.activePlayer === modalState.visibleModal && modalState.isPlaying) {
                pausePlayback();
              } else {
                startPlayback(modalState.visibleModal, true);
              }
            }
          }}
          onBoost={handleBoost}
          currentUserId={user?.id || 'guest'}
        />

        {/* Hidden audio player for inline thumbnail playback */}
        <audio
          ref={audioRef}
          onEnded={handleTrackEnd}
          className="hidden"
        />

        {/* Login modal for anonymous users hitting boost limit */}
        <EchoLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Unlock Unlimited Boosts"
          subtitle="Sign in with Echo to get unlimited voting power and earn platform points"
        />
      </div>
    </div>
  );
}
