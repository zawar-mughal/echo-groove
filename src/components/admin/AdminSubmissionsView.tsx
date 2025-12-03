import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Trophy, TrendingUp, Play, Users, Clock, Crown, Award, Medal, Eye, EyeOff, Trash2, Music, Pause, Loader2 } from 'lucide-react';
import { Season } from '@/types/admin';
import { useSubmissions, useUpdateSubmission, useDeleteSubmission } from '@/hooks/api/useSubmissions';
import { useAudiusStream } from '@/hooks/useAudiusStream';
import { mapSubmissionRecordToMediaSubmission } from '@/utils/submissionMapper';
import { useRoomPlaylist, useAddTrackToPlaylist } from '@/hooks/api/usePlaylists';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminSubmissionsViewProps {
  season: Season;
  roomTitle: string;
  onBack: () => void;
}

export function AdminSubmissionsView({ season, roomTitle, onBack }: AdminSubmissionsViewProps) {
  const { user } = useAuth();
  // Fetch real submissions from Supabase
  const { data: submissions = [], isLoading } = useSubmissions(season.id, { includeHidden: true });
  const updateSubmission = useUpdateSubmission();
  const deleteSubmission = useDeleteSubmission();
  const { data: playlistData } = useRoomPlaylist(season.roomId);
  const addTrackToPlaylist = useAddTrackToPlaylist();

  const playlistSubmissionIds = useMemo(
    () => new Set(playlistData?.tracks.map((track) => track.submission.id) ?? []),
    [playlistData]
  );

  const mediaSubmissions = useMemo(
    () => submissions.map(mapSubmissionRecordToMediaSubmission),
    [submissions]
  );

  const seasonSubmissions = useMemo(
    () =>
      [...mediaSubmissions]
        .sort((a, b) => (b.actualBoosts ?? 0) - (a.actualBoosts ?? 0))
        .map((submission, index) => ({
          media: submission,
          rank: index + 1,
          isWinner: index < 3 && season.status === 'completed',
        })),
    [mediaSubmissions, season.status]
  );

  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  const activePreviewSubmission = useMemo(
    () => seasonSubmissions.find((entry) => entry.media.id === activePreviewId)?.media,
    [seasonSubmissions, activePreviewId]
  );

  const shouldLoadAudiusPreview =
    activePreviewSubmission?.provider === 'audius' &&
    !!activePreviewSubmission?.provider_track_id;

  const { data: previewStreamUrl, isLoading: isPreviewStreamLoading } = useAudiusStream(
    shouldLoadAudiusPreview ? activePreviewSubmission?.provider_track_id : undefined
  );

  const previewFallbackSrc =
    !shouldLoadAudiusPreview
      ? activePreviewSubmission?.audioUrl || activePreviewSubmission?.externalLink
      : undefined;

  const resolvedPreviewSrc = previewStreamUrl || previewFallbackSrc;

  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPreviewPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (resolvedPreviewSrc && activePreviewSubmission) {
      if (audio.src !== resolvedPreviewSrc) {
        audio.src = resolvedPreviewSrc;
        audio.load();
      }

      if (isPreviewPlaying) {
        audio.play().catch(() => setIsPreviewPlaying(false));
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
    }
  }, [resolvedPreviewSrc, activePreviewSubmission, isPreviewPlaying]);

  const handleToggleVisibility = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      await updateSubmission.mutateAsync({
        id: submissionId,
        updates: { is_visible: !submission.is_visible }
      });
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    await deleteSubmission.mutateAsync(submissionId);
  };

  const handleAddToPlaylist = async (submissionId: string) => {
    if (!user) {
      toast.error('You must be signed in to manage playlists.');
      return;
    }

    try {
      await addTrackToPlaylist.mutateAsync({
        roomId: season.roomId,
        submissionId,
        seasonId: season.id,
        addedBy: user.id,
      });
      toast.success('Track added to room playlist');
    } catch (error) {
      console.error('Failed to add playlist track', error);
      toast.error('Unable to add track to playlist');
    }
  };

  const handlePreviewToggle = (submissionId: string) => {
    if (activePreviewId === submissionId) {
      if (isPreviewPlaying) {
        previewAudioRef.current?.pause();
        setIsPreviewPlaying(false);
      } else if (resolvedPreviewSrc) {
        setIsPreviewPlaying(true);
      }
      return;
    }

    setActivePreviewId(submissionId);
    setIsPreviewPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading submissions...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'voting': return 'bg-orange-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'voting': return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getRankIcon = (rank: number, status: string) => {
    if (season.status !== 'completed') return null;
    
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Award className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const getSubmissionStatus = (rank: number, isVisible: boolean) => {
    if (!isVisible) return 'Hidden';
    if (season.status !== 'completed') return 'Active';
    if (rank === 1) return 'Winner';
    if (rank <= 3) return 'Finalist';
    return 'Participant';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {roomTitle} Seasons
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{season.title}</h1>
              <Badge variant={getStatusVariant(season.status)}>
                {season.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{season.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{seasonSubmissions.length}</div>
            <div className="text-sm text-muted-foreground">Submissions</div>
          </div>
        </div>
      </div>

      {/* Season Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Duration
              </div>
              <div className="font-semibold">
                {formatDate(season.startDate)} - {formatDate(season.endDate)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Participants
              </div>
              <div className="font-semibold">{seasonSubmissions.length}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Total Boosts
              </div>
              <div className="font-semibold">
                {seasonSubmissions.reduce((sum, sub) => sum + sub.media.boosts, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <Play className="w-4 h-4" />
                Total Plays
              </div>
              <div className="font-semibold">
                {seasonSubmissions.reduce((sum, sub) => sum + sub.media.playCount, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners Section (if completed) */}
      {season.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Season Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seasonSubmissions.slice(0, 3).map((submission, index) => (
                <div key={submission.media.id} className="text-center">
                  <div className="mb-2">
                    {getRankIcon(index + 1, 'completed')}
                  </div>
                  <div className="font-semibold">{submission.media.title}</div>
                  <div className="text-sm text-muted-foreground">{submission.media.creator}</div>
                  <div className="text-lg font-bold text-primary mt-1">{submission.media.boosts.toLocaleString()} boosts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            {season.status === 'completed' 
              ? 'Final rankings and results' 
              : `Live competition - ${getDaysRemaining(season.endDate)} days remaining`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Boosts</TableHead>
                <TableHead>Plays</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasonSubmissions.map((submission) => {
                const isActivePreview = activePreviewId === submission.media.id;
                const isRowPlaying = isActivePreview && isPreviewPlaying;
                const isRowLoading =
                  isActivePreview &&
                  submission.media.provider === 'audius' &&
                  isPreviewStreamLoading;
                const isInPlaylist = playlistSubmissionIds.has(submission.media.id);
                const canPreview = Boolean(
                  (submission.media.provider === 'audius' && submission.media.provider_track_id) ||
                  submission.media.audioUrl ||
                  (submission.media.provider !== 'audius' && submission.media.externalLink)
                );

                return (
                  <TableRow key={submission.media.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{submission.rank}</span>
                        {getRankIcon(submission.rank, submission.isWinner ? 'completed' : 'active')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Preview track"
                        onClick={() => handlePreviewToggle(submission.media.id)}
                        disabled={!canPreview}
                      >
                        {isActivePreview ? (
                          isRowLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isRowPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.media.title}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {submission.media.mediaType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.media.creator}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{submission.media.boosts.toLocaleString()}</span>
                        {submission.media.velocityTrend === 'rising' && (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{submission.media.playCount}</TableCell>
                    <TableCell>
                      <Badge variant={submission.media.isVisible ? (submission.isWinner ? 'default' : 'secondary') : 'outline'}>
                        {getSubmissionStatus(submission.rank, submission.media.isVisible)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submission.media.submittedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title={isInPlaylist ? 'Already in playlist' : 'Add to playlist'}
                          onClick={() => handleAddToPlaylist(submission.media.id)}
                          disabled={isInPlaylist || addTrackToPlaylist.isPending}
                        >
                          <Music className={`w-4 h-4 ${isInPlaylist ? 'text-muted-foreground' : 'text-primary'}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleVisibility(submission.media.id)}
                          title={submission.media.isVisible ? 'Hide submission' : 'Show submission'}
                        >
                          {submission.media.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Delete submission">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete "{submission.media.title}" by {submission.media.creator}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteSubmission(submission.media.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
      {seasonSubmissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No submissions yet</p>
        </div>
      )}
    </CardContent>
  </Card>

      <audio ref={previewAudioRef} className="hidden" />
    </div>
  );
}
