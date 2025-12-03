import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Trophy, TrendingUp, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformPoints, useAllBoostHistory, useUserRoomScores } from '@/hooks/api/usePlatformPointsDB';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useUserSubmissions } from '@/hooks/api/useSubmissions';
import { useProfileByUsername } from '@/hooks/api/useProfiles';
import { formatDistanceToNow } from 'date-fns';
import { getPublicAssetUrl } from '@/lib/storage';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';
import { SongProfileModal } from '@/components/SongProfileModal';
import type { MediaSubmission } from '@/types/submission';

type BoostHistoryRow = Database['public']['Tables']['boost_history']['Row'] & {
  submissions: {
    id: string;
    title: string | null;
    thumbnail_path: string | null;
  } | null;
};

type RoomScoreRow = Database['public']['Tables']['user_room_scores']['Row'] & {
  rooms: {
    id: string;
    title: string | null;
    slug: string | null;
  } | null;
};

const Profile = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { profile: authProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<MediaSubmission | null>(null);

  const viewingSelf = !routeUsername || authProfile?.username === routeUsername;

  const { data: profileByUsername, isLoading: profileLoading } = useProfileByUsername(
    viewingSelf ? undefined : routeUsername
  );

  const activeProfile = viewingSelf ? authProfile : profileByUsername;
  const activeUserId = activeProfile?.id;

  // Debug logging for user ID and submissions
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[Profile] Debug info:', {
      viewingSelf,
      routeUsername,
      authProfile: authProfile ? { id: authProfile.id, username: authProfile.username } : null,
      profileByUsername: profileByUsername ? { id: profileByUsername.id, username: profileByUsername.username } : null,
      activeProfile: activeProfile ? { id: activeProfile.id, username: activeProfile.username } : null,
      activeUserId
    });
  }, [viewingSelf, routeUsername, authProfile, profileByUsername, activeProfile, activeUserId]);

  const { data: platformPointsData } = usePlatformPoints(activeUserId);
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    isError: submissionsError,
    error: submissionsErrorDetails,
    refetch: refetchSubmissions,
  } = useUserSubmissions(activeUserId);

  const userSubmissions = submissionsData ?? [];

  // Debug logging for submissions
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[Profile] Submissions data:', {
      activeUserId,
      submissionsCount: userSubmissions.length,
      submissionsLoading,
      submissions: userSubmissions
    });
  }, [activeUserId, userSubmissions, submissionsLoading]);
  const {
    data: boostHistoryData = [],
    isLoading: boostHistoryLoading,
  } = useAllBoostHistory(activeUserId);
  const {
    data: roomScoresData = [],
    isLoading: roomScoresLoading,
  } = useUserRoomScores(activeUserId);

  const boostHistory = useMemo(
    () => (boostHistoryData as BoostHistoryRow[]) ?? [],
    [boostHistoryData]
  );
  const roomScores = useMemo(
    () => (roomScoresData as RoomScoreRow[]) ?? [],
    [roomScoresData]
  );

  const totalBoosts = useMemo(
    () => boostHistory.reduce((sum, entry) => sum + Number(entry.boost_count ?? 0), 0),
    [boostHistory]
  );
  const totalCommunityPoints = useMemo(
    () =>
      boostHistory.reduce(
        (sum, entry) => sum + Number(entry.community_points_earned ?? 0),
        0
      ),
    [boostHistory]
  );
  const totalCuratorPoints = useMemo(
    () =>
      boostHistory.reduce(
        (sum, entry) => sum + Number(entry.curator_points_earned ?? 0),
        0
      ),
    [boostHistory]
  );

  const summaryBoosts = Math.max(Number(platformPointsData?.totalBoosts ?? 0), totalBoosts);
  const summaryCommunityPoints = Math.max(
    Number(platformPointsData?.communityPoints ?? 0),
    totalCommunityPoints
  );
  const summaryCuratorPoints = Math.max(
    Number(platformPointsData?.curatorPoints ?? 0),
    totalCuratorPoints
  );

  if (import.meta.env.DEV) {
    console.debug('Profile activity data', {
      activeUserId,
      submissions: submissionsData,
      boostHistory,
      roomScores,
    });
  }

  if (!activeProfile && (profileLoading || authLoading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading profile...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon={Music}
            title={viewingSelf ? 'Sign in to view your profile' : 'Profile Not Found'}
            description={
              viewingSelf
                ? 'Create an account or sign in with Audius to start tracking your submissions and boosts.'
                : 'We could not find a profile for this user.'
            }
            actionLabel={viewingSelf ? 'Browse Rooms' : 'Go Home'}
            onAction={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  const avatarUrl = activeProfile.avatar_url
    ? getPublicAssetUrl(activeProfile.avatar_url) ?? activeProfile.avatar_url
    : undefined;
  const displayName = activeProfile.display_name || activeProfile.username || 'User';
  const usernameLabel = activeProfile.username ? `@${activeProfile.username}` : '';

  const userSubmissionsCount = userSubmissions.length;
  const activeRoomsCount = roomScores.length;

  const emptySubmissionsTitle = viewingSelf
    ? 'No Submissions Yet'
    : 'No Submissions Available';
  const emptySubmissionsDescription = viewingSelf
    ? 'Submit your first track to start building your profile.'
    : 'This user has not submitted any tracks yet.';

  const emptyActivityTitle = viewingSelf
    ? 'No Boost Activity Yet'
    : 'No Boost Activity Available';
  const emptyActivityDescription = viewingSelf
    ? 'Boost tracks to earn curator points and climb the leaderboards.'
    : 'This user has not boosted any tracks yet.';

  const formatRelativeDate = (value: string | null) => {
    if (!value) return 'Never';
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {displayName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
                  {usernameLabel && <p className="text-muted-foreground">{usernameLabel}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg border bg-card/60">
                    <div className="text-2xl font-bold text-primary">
                      {platformPointsData?.totalPlatformPoints ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-card/60">
                    <div className="text-2xl font-bold text-primary">{userSubmissionsCount}</div>
                    <div className="text-sm text-muted-foreground">Submissions</div>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-card/60">
                    <div className="text-2xl font-bold text-primary">{activeRoomsCount}</div>
                    <div className="text-sm text-muted-foreground">Rooms Participated</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Submitted Tracks
                </CardTitle>
                <CardDescription>
                  Tracks submitted by {displayName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsError ? (
                  <ErrorState
                    title="Failed to load submissions"
                    message={submissionsErrorDetails instanceof Error ? submissionsErrorDetails.message : 'We could not load the submissions for this user.'}
                    onRetry={() => refetchSubmissions()}
                  />
                ) : submissionsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading submissions...</div>
                ) : userSubmissionsCount === 0 ? (
                  <EmptyState
                    icon={Music}
                    title={emptySubmissionsTitle}
                    description={emptySubmissionsDescription}
                    actionLabel={viewingSelf ? 'Browse Rooms' : undefined}
                    onAction={viewingSelf ? () => navigate('/') : undefined}
                    compact
                  />
                ) : (
                  <div className="space-y-4">
                    {userSubmissions.map((item) => {
                      const artwork =
                        item.submission.thumbnail ||
                        item.submission.coverArt ||
                        (item.submission.thumbnailPath
                          ? getPublicAssetUrl(item.submission.thumbnailPath)
                          : undefined);

                      const season = item.season;

                      return (
                        <div
                          key={item.submission.id}
                          className="flex flex-col gap-4 rounded-lg border border-border p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {artwork ? (
                                  <img
                                    src={artwork}
                                    alt={item.submission.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <Music className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h3 className="font-semibold text-foreground truncate">
                                  {item.submission.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Submitted {formatRelativeDate(item.submission.submittedAt.toISOString())}
                                </p>
                                {item.room && item.room.slug && (
                                  <RouterLink
                                    to={`/room/${item.room.slug}`}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {item.room.title}
                                  </RouterLink>
                                )}
                              </div>
                            </div>
                            <div className="w-full text-sm text-muted-foreground sm:w-auto sm:ml-auto">
                              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:min-w-[240px]">
                                <div className="space-y-1">
                                  <div className="font-semibold text-foreground">
                                    {Number(item.submission.boosts ?? 0)}
                                  </div>
                                  <div>Boosts</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="font-semibold text-foreground">
                                    {Number(item.submission.playCount ?? 0)}
                                  </div>
                                  <div>Plays</div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant={item.submission.isVisible ? 'secondary' : 'outline'}>
                                    {item.submission.isVisible ? 'Visible' : 'Hidden'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Status</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {season ? (
                                <>
                                  <Badge variant={season.status === 'active' ? 'default' : 'outline'}>
                                    {season.status ? season.status.charAt(0).toUpperCase() + season.status.slice(1) : 'Season'}
                                  </Badge>
                                  <span className="font-medium text-foreground">{season.title}</span>
                                  {season.endDate && (
                                    <span>Ends {formatRelativeDate(season.endDate)}</span>
                                  )}
                                </>
                              ) : (
                                <span>Not currently competing in a season</span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setSelectedSubmission(item.submission)}
                            >
                              View Song Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Boost Activity
                </CardTitle>
                <CardDescription>
                  Recent boosts and points earned by {displayName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{summaryBoosts}</div>
                    <div className="text-muted-foreground">Total Boosts</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{summaryCommunityPoints}</div>
                    <div className="text-muted-foreground">Community Points</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{summaryCuratorPoints}</div>
                    <div className="text-muted-foreground">Curator Points</div>
                  </div>
                </div>

                {boostHistoryLoading ? (
                  <div className="text-sm text-muted-foreground">Loading activity...</div>
                ) : boostHistory.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title={emptyActivityTitle}
                    description={emptyActivityDescription}
                    actionLabel={viewingSelf ? 'Browse Rooms' : undefined}
                    onAction={viewingSelf ? () => navigate('/') : undefined}
                    compact
                  />
                ) : (
                  <div className="space-y-4">
                    {boostHistory.map((entry) => {
                      const thumbnail = entry.submissions?.thumbnail_path
                        ? getPublicAssetUrl(entry.submissions.thumbnail_path)
                        : undefined;

                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={entry.submissions?.title ?? 'Track artwork'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Music className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {entry.submissions?.title ?? 'Unknown track'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Last boosted {formatRelativeDate(entry.last_boost_at)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto sm:ml-auto flex flex-col gap-2">
                            <div className="grid grid-cols-1 gap-3 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:min-w-[270px]">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">
                                  {Number(entry.boost_count ?? 0)}
                                </div>
                                <div>Total Boosts</div>
                              </div>
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">
                                  {Number(entry.community_points_earned ?? 0)}
                                </div>
                                <div>Community Points</div>
                              </div>
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">
                                  {Number(entry.curator_points_earned ?? 0)}
                                </div>
                                <div>Curator Points</div>
                              </div>
                            </div>
                            {entry.was_early_booster && (
                              <div className="flex justify-center sm:justify-end">
                                <Badge variant="outline">Early Booster</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Room Highlights
                </CardTitle>
                <CardDescription>
                  Performance across rooms {displayName} has joined
                </CardDescription>
              </CardHeader>
              <CardContent>
                {roomScoresLoading ? (
                  <div className="text-sm text-muted-foreground">Loading room stats...</div>
                ) : roomScores.length === 0 ? (
                  <EmptyState
                    icon={Trophy}
                    title={viewingSelf ? 'No Room Participation Yet' : 'No Room Data'}
                    description={
                      viewingSelf
                        ? 'Join a room to start competing and tracking your impact.'
                        : 'This user has not participated in any rooms yet.'
                    }
                    actionLabel={viewingSelf ? 'Explore Rooms' : undefined}
                    onAction={viewingSelf ? () => navigate('/') : undefined}
                    compact
                  />
                ) : (
                  <div className="space-y-4">
                    {roomScores.map((score) => {
                      const roomSlug = score.rooms?.slug ?? '';
                      const roomTitle = score.rooms?.title ?? 'Unknown room';

                      return (
                        <div
                          key={score.id}
                          className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            {roomSlug ? (
                              <RouterLink
                                to={`/room/${roomSlug}`}
                                className="font-semibold text-foreground hover:underline"
                              >
                                {roomTitle}
                              </RouterLink>
                            ) : (
                              <span className="font-semibold text-foreground">{roomTitle}</span>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Total boosts {score.total_boosts ?? 0} • Seasons participated {score.seasons_participated ?? 0}
                            </p>
                          </div>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground sm:ml-auto">
                          <div className="text-center min-w-[90px]">
                            <div className="font-semibold text-foreground">
                              {Number(score.total_points ?? 0)}
                            </div>
                            <div>Points</div>
                          </div>
                          <div className="text-center min-w-[90px]">
                            <div className="font-semibold text-foreground">
                              {score.curator_accuracy ? `${(score.curator_accuracy * 100).toFixed(0)}%` : '—'}
                            </div>
                            <div>Accuracy</div>
                          </div>
                            {score.is_top_supporter && (
                              <Badge variant="secondary" className="gap-1">
                                <Crown className="w-3 h-3" />
                                Top Supporter
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <SongProfileModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          canBoost={false}
          roomSlug={selectedSubmission?.roomSlug}
        />
      </div>
    </div>
  );
};

export default Profile;
