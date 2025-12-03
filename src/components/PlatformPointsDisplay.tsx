import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Users, Loader2 } from 'lucide-react';
import { usePlatformPoints, useCanEarnCommunityPoints, useRemainingPointBoosts, useAllBoostHistory } from '@/hooks/api/usePlatformPointsDB';
import { cn } from '@/lib/utils';

import { Link } from 'react-router-dom';

interface PlatformPointsDisplayProps {
  userId: string;
  linkTo?: string;
}

export const PlatformPointsDisplay = ({ userId, linkTo }: PlatformPointsDisplayProps) => {
  const { data: pointsData, isLoading } = usePlatformPoints(userId);
  const { data: boostHistory = [] } = useAllBoostHistory(userId);
  const canEarnMore = useCanEarnCommunityPoints(userId);
  const remainingBoosts = useRemainingPointBoosts(userId);

  if (isLoading && boostHistory.length === 0) {
    return (
      <div className="flex items-center gap-2 mr-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fallbackCommunity = boostHistory.reduce(
    (sum, entry) => sum + Number(entry.community_points_earned ?? 0),
    0
  );
  const fallbackCurator = boostHistory.reduce(
    (sum, entry) => sum + Number(entry.curator_points_earned ?? 0),
    0
  );
  const fallbackBoosts = boostHistory.reduce(
    (sum, entry) => sum + Number(entry.boost_count ?? 0),
    0
  );

  const combinedCurator = Math.max(Number(pointsData?.curatorPoints ?? 0), fallbackCurator);
  const combinedCommunity = Math.max(Number(pointsData?.communityPoints ?? 0), fallbackCommunity);
  const combinedBoosts = Math.max(Number(pointsData?.totalBoosts ?? 0), fallbackBoosts);

  const roundedCuratorPoints = Math.round(combinedCurator);
  const roundedCommunityPoints = Math.round(combinedCommunity);

  if (!pointsData && boostHistory.length === 0) {
    return null;
  }

  const Wrapper = React.forwardRef<HTMLElement, { children: React.ReactNode; className?: string }>(
    ({ children, className }, ref) => {
      if (!linkTo) {
        return (
          <span ref={ref as React.Ref<HTMLSpanElement>} className={className}>
            {children}
          </span>
        );
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={linkTo}
          className={cn('no-underline', className)}
        >
          {children}
        </Link>
      );
    }
  );
  Wrapper.displayName = 'PlatformPointsLinkWrapper';

  const exactCommunity = combinedCommunity;
  const exactCurator = combinedCurator;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-end gap-1 mr-3">
        {/* Curator Points - Highlighted */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Wrapper className="inline-flex">
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-100 font-semibold hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-200"
              >
                <Crown className="w-3 h-3 mr-1 text-amber-400" />
                <span className="text-xs mr-1">Curator</span>
                {roundedCuratorPoints}
              </Badge>
            </Wrapper>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-semibold text-amber-400">Curator Points</div>
              <div className="text-xs text-muted-foreground">
                Earned when your boosted songs make it to playlists
              </div>
              <div className="text-xs mt-1">
                Exact: {exactCurator.toFixed(2)}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Community Points - Less prominent */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Wrapper className="inline-flex">
              <Badge 
                variant="outline" 
                className="text-xs text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
              >
                <Users className="w-2.5 h-2.5 mr-1" />
                <span className="text-xs mr-1">Community</span>
                {roundedCommunityPoints}
              </Badge>
            </Wrapper>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-semibold">Community Points</div>
              <div className="text-xs text-muted-foreground">
                Earned from boosting songs (decay system)
              </div>
              <div className="text-xs mt-1">
                Exact: {exactCommunity.toFixed(2)}
              </div>
              <div className="text-xs mt-1">
                Total boosts logged: {combinedBoosts}
              </div>
              <div className="text-xs mt-1">
                {canEarnMore ? (
                  <span className="text-green-400">
                    {remainingBoosts} boosts remaining today
                  </span>
                ) : (
                  <span className="text-orange-400">
                    Daily limit reached
                  </span>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
