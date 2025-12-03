import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Crown } from 'lucide-react';
import { GameState } from '@/types/submission';
import { ShuffleButton } from '@/components/ShuffleButton';
import { useRoomTopSupporter } from '@/hooks/api/useLeaderboards';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaylistStats {
  trackCount: number;
  durationMinutes: number;
  seasonsCount: number;
}

interface GameStatsProps {
  gameState: GameState;
  competingCount: number;
  roomId?: string;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
  showMute?: boolean;
  showShuffle?: boolean;
  shuffleMode?: 'modal' | 'inline';
  onShuffle?: () => void;
  shuffleActive?: boolean;
  mode?: 'season' | 'playlist';
  playlistStats?: PlaylistStats;
}

export const GameStats = ({
  gameState,
  competingCount,
  roomId,
  isMuted,
  setIsMuted,
  showMute = false,
  showShuffle = false,
  shuffleMode = 'modal',
  onShuffle,
  shuffleActive = false,
  mode = 'season',
  playlistStats
}: GameStatsProps) => {
  const { data: topSupporter } = useRoomTopSupporter(roomId);

  const isPlaylistMode = mode === 'playlist';
  const shuffleDisabled = isPlaylistMode && (!playlistStats || playlistStats.trackCount === 0);
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-lg border hover-lift animate-fade-in mx-4 sm:mx-0">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          {isPlaylistMode ? (
            <>
              <div className="text-xs text-muted-foreground">
                <div className="font-mono text-sm">{playlistStats?.trackCount || 0}</div>
                <div>tracks</div>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="font-mono text-sm text-blue-500">{playlistStats?.durationMinutes || 0}m</div>
                <div>duration</div>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="font-mono text-sm text-purple-500">{playlistStats?.seasonsCount || 0}</div>
                <div>seasons</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                <div className="font-mono text-sm">{gameState.submissions.length}</div>
                <div>submissions</div>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="font-mono text-sm text-yellow-500">{gameState.competingSubmissions || competingCount}</div>
                <div>trending</div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground cursor-default">
                      <div className="flex items-center justify-center gap-1">
                        {topSupporter && (
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={topSupporter.avatar} alt={topSupporter.username} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {topSupporter.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <Crown className="w-3 h-3 text-amber-400" />
                      </div>
                      <div>top supporter</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {topSupporter ? (
                      <div className="text-sm">
                        <div className="font-semibold">{topSupporter.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {topSupporter.totalPoints} community points (7 days)
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">No supporters yet</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
        
        {/* Mobile Controls */}
        <div className="flex justify-center">
          {showShuffle && onShuffle && (
            <ShuffleButton
              onShuffle={onShuffle}
              mode={shuffleMode}
              isActive={shuffleActive}
              disabled={shuffleDisabled}
            />
          )}
          {showMute && isMuted !== undefined && setIsMuted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {isPlaylistMode ? (
            <>
              <span className="font-mono hover:text-primary transition-colors cursor-default">{playlistStats?.trackCount || 0} tracks</span>
              <span className="font-mono text-blue-500 hover:text-blue-400 transition-colors cursor-default">
                {playlistStats?.durationMinutes || 0} minutes
              </span>
              <span className="font-mono text-purple-500 hover:text-purple-400 transition-colors cursor-default">
                {playlistStats?.seasonsCount || 0} seasons curated
              </span>
            </>
          ) : (
            <>
              <span className="font-mono hover:text-primary transition-colors cursor-default">{gameState.submissions.length} submissions</span>
              <span className="font-mono text-yellow-500 hover:text-yellow-400 transition-colors cursor-default">
                {gameState.competingSubmissions || competingCount} trending this season
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 font-mono hover:text-primary transition-colors cursor-default">
                      {topSupporter && (
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={topSupporter.avatar} alt={topSupporter.username} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {topSupporter.username[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>top supporter</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {topSupporter ? (
                      <div className="text-sm">
                        <div className="font-semibold">{topSupporter.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {topSupporter.totalPoints} community points (7 days)
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">No supporters yet</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {showShuffle && onShuffle && (
            <ShuffleButton
              onShuffle={onShuffle}
              mode={shuffleMode}
              isActive={shuffleActive}
              disabled={shuffleDisabled}
            />
          )}
          {showMute && isMuted !== undefined && setIsMuted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
