import { MediaSubmission } from '@/types/submission';

export const getTrendingSubmission = (submissions: MediaSubmission[]): MediaSubmission | null => {
  const visibleSubmissions = submissions.filter(s => s.isVisible !== false);

  // No submissions at all
  if (visibleSubmissions.length === 0) {
    return null;
  }

  // Check for explicitly trending submissions
  const explicitlyTrending = visibleSubmissions.filter(submission => submission.isRising);
  if (explicitlyTrending.length > 0) {
    return explicitlyTrending.sort((a, b) => b.actualBoosts - a.actualBoosts)[0];
  }

  // Check for submissions with 3+ unique users boosting in last 2 hours
  const now = Date.now();
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);

  const recentlyBoosted = visibleSubmissions
    .map(submission => {
      const recentUsers = submission.userBoostData.filter(
        userData => userData.lastBoostTime.getTime() > twoHoursAgo
      ).length;
      return {
        submission,
        recentUserCount: recentUsers,
      };
    })
    .filter(item => item.recentUserCount >= 3)
    .sort((a, b) => b.recentUserCount - a.recentUserCount);

  if (recentlyBoosted.length > 0) {
    return recentlyBoosted[0].submission;
  }

  // Fallback: Return the first submitted song (earliest submittedAt)
  return visibleSubmissions.sort((a, b) =>
    a.submittedAt.getTime() - b.submittedAt.getTime()
  )[0];
};

export const getCompetingCount = (submissions: MediaSubmission[]): number => {
  const now = Date.now();
  const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours in milliseconds
  
  // Filter only visible submissions
  const visibleSubmissions = submissions.filter(s => s.isVisible !== false);
  
  // Count submissions that have 3+ unique users boosted in last 2 hours (trending-eligible)
  return visibleSubmissions.filter(submission => {
    const recentUsers = submission.userBoostData.filter(
      userData => userData.lastBoostTime.getTime() > twoHoursAgo
    ).length;
    return recentUsers >= 3;
  }).length;
};

export const sortSubmissions = (submissions: MediaSubmission[]): { regular: MediaSubmission[], trending: MediaSubmission | null } => {
  const trending = getTrendingSubmission(submissions);
  
  // Filter only visible submissions
  const visibleSubmissions = submissions.filter(s => s.isVisible !== false);
  
  const regular = [...visibleSubmissions]
    .filter(s => s.id !== trending?.id) // Exclude trending from regular list
    .sort((a, b) => {
      // Enhanced ranking algorithm using actual boosts and engagement metrics
      if (a.isRising && !b.isRising) return -1;
      if (!a.isRising && b.isRising) return 1;
      
      // Primary sort by actual weighted boosts + user diversity bonus
      const scoreA = a.actualBoosts + (a.userBoostData.length * 5); // Reward user diversity
      const scoreB = b.actualBoosts + (b.userBoostData.length * 5);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Secondary sort by recent user engagement (stored in boostVelocity)
      if (a.boostVelocity !== b.boostVelocity) return b.boostVelocity - a.boostVelocity;
      
      // Tertiary sort by total engagement diversity
      const diversityA = a.userBoostData.length;
      const diversityB = b.userBoostData.length;
      
      return diversityB - diversityA;
    });
  
  return { regular, trending };
};
