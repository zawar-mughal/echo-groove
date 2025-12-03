import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Pause, Share, Clock } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { BoostButton } from './BoostButton';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getPublicAssetUrl } from '@/lib/storage';
import { useSubmissionSeasonHistory } from '@/hooks/api/useSubmissions';

interface SongProfileModalProps {
  submission: MediaSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onBoost?: (submissionId: string) => void;
  canBoost?: boolean;
  onPlay?: (submissionId: string) => void;
  isPlaying?: boolean;
  roomSlug?: string;
}

export const SongProfileModal = ({
  submission,
  isOpen,
  onClose,
  onBoost,
  canBoost = false,
  onPlay,
  isPlaying = false,
  roomSlug,
}: SongProfileModalProps) => {
  const [artworkError, setArtworkError] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'details' | 'history'>('details');

  React.useEffect(() => {
    setArtworkError(false);
    setViewMode('details');
  }, [submission?.id]);

  const submissionId = submission?.id;
  const providerTrackId = submission?.provider_track_id;

  const { data: seasonHistory = [], isLoading: historyLoading } = useSubmissionSeasonHistory(
    submissionId,
    providerTrackId
  );

  const currentSeasons = React.useMemo(
    () => seasonHistory.filter((entry) => entry.season?.status === 'active'),
    [seasonHistory]
  );

  if (!submission) return null;

  const shareSlug = roomSlug ?? submission.roomSlug;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '2:13';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const artwork =
    submission.coverArt ||
    submission.thumbnail ||
    (submission.thumbnailPath && !artworkError
      ? getPublicAssetUrl(submission.thumbnailPath)
      : undefined);

  const profileHref = `/profile/${encodeURIComponent(submission.submittedBy.username)}`;

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    const shareUrl = shareSlug
      ? `${window.location.origin}/room/${shareSlug}?track=${submission.id}`
      : `${window.location.origin}/?track=${submission.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied',
        description: 'Share this track with your friends!',
      });
    } catch (error) {
      console.error('Failed to copy share link', error);
      toast({
        title: 'Copy failed',
        description: shareUrl,
        variant: 'destructive',
      });
    }
  };

  const renderSeasonBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">Season</Badge>;
    const normalized = status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge variant={status === 'active' ? 'secondary' : 'outline'}>{normalized}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>{submission.title}</DialogTitle>
          <DialogDescription>
            Track details for {submission.title} by {submission.creator}
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-full">
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => onPlay?.(submission.id)}
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg transition-all hover:scale-105"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-800" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
                )}
              </button>

              <div className="flex-1 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm opacity-80">{submission.creator}</span>
                  <span className="text-sm opacity-60">•</span>
                  <span className="text-sm opacity-80">{formatDate(submission.submittedAt)}</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{submission.title}</h1>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(submission.duration)}
                  </div>
                  {submission.isRising && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      🔥 Trending
                    </Badge>
                  )}
                </div>
              </div>

              <div className="w-32 h-32 rounded-lg overflow-hidden shadow-lg border border-white/20">
                {artwork ? (
                  <img
                    src={artwork}
                    alt={submission.title}
                    className="w-full h-full object-cover"
                    onError={() => setArtworkError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/60">
                      {submission.title[0]?.toUpperCase() || 'M'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white text-gray-900 space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              {canBoost && onBoost && (
                <BoostButton
                  onBoost={() => onBoost(submission.id)}
                  boostCount={submission.boosts}
                  variant="default"
                />
              )}

              <Button variant="outline" size="sm" onClick={handleShare} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>

              {submission.externalLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  asChild
                >
                  <a href={submission.externalLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Audius
                  </a>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{submission.playCount.toLocaleString()} plays</span>
              </div>
              {submission.isRising && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🔥 {submission.velocityTrend}</span>
                </div>
              )}
            </div>

            {viewMode === 'details' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Current Seasons
                  </h3>
                  {seasonHistory.length > 1 && (
                    <Button variant="link" size="sm" onClick={() => setViewMode('history')}>
                      See all
                    </Button>
                  )}
                </div>
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground">Loading seasons...</p>
                ) : currentSeasons.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {currentSeasons.map((entry) => (
                      <div
                        key={entry.submissionId}
                        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                      >
                        {renderSeasonBadge(entry.season?.status ?? null)}
                        <span className="font-medium text-gray-900">{entry.season?.title ?? 'Season'}</span>
                        {entry.season?.room?.slug && (
                          <Link to={`/room/${entry.season.room.slug}`} className="hover:underline">
                            {entry.season.room.title ?? 'Room'}
                          </Link>
                        )}
                        {entry.season?.endDate && (
                          <span>Ends {formatDate(entry.season.endDate)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : seasonHistory.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {renderSeasonBadge(seasonHistory[0].season?.status ?? null)}
                      <span className="font-medium text-gray-900">{seasonHistory[0].season?.title ?? 'Season'}</span>
                      {seasonHistory[0].season?.room?.slug && (
                        <Link to={`/room/${seasonHistory[0].season.room.slug}`} className="hover:underline">
                          {seasonHistory[0].season.room.title ?? 'Room'}
                        </Link>
                      )}
                    </div>
                  </div>
                ) : submission.seasonTitle ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {renderSeasonBadge(submission.seasonStatus ?? null)}
                    <span className="font-medium text-gray-900">{submission.seasonTitle}</span>
                    {submission.roomSlug && (
                      <Link to={`/room/${submission.roomSlug}`} className="hover:underline">
                        {submission.roomTitle ?? 'Room'}
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not currently competing in a season.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Season History</h3>
                  <Button variant="link" size="sm" onClick={() => setViewMode('details')}>
                    Back to details
                  </Button>
                </div>
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground">Loading seasons...</p>
                ) : seasonHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No season history available for this track.</p>
                ) : (
                  <div className="space-y-2">
                    {seasonHistory.map((entry) => (
                      <div
                        key={entry.submissionId}
                        className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {renderSeasonBadge(entry.season?.status ?? null)}
                          <span className="font-medium text-gray-900">{entry.season?.title ?? 'Season'}</span>
                          {entry.season?.room?.slug && (
                            <Link to={`/room/${entry.season.room.slug}`} className="hover:underline">
                              {entry.season.room.title ?? 'Room'}
                            </Link>
                          )}
                        </div>
                        <p className="mt-1 text-xs">
                          Submitted {formatDate(entry.createdAt)}
                          {entry.season?.endDate ? ` • Ends ${formatDate(entry.season.endDate)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                {submission.submittedBy.username[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  <Link to={profileHref} className="hover:underline">
                    {submission.submittedBy.username}
                  </Link>
                </h3>
                <p className="text-sm text-gray-500">Submitter</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
