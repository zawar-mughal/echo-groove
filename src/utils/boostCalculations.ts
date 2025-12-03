export interface UserBoostData {
  userId: string;
  boostCount: number;
  lastBoostTime: Date;
}

export interface BoostCalculationResult {
  displayBoosts: number; // What the user sees
  actualValue: number;   // Weighted value for ranking
  newUserBoostData: UserBoostData[];
}

export const calculateBoostValue = (
  currentBoostCount: number,
  userBoostData: UserBoostData[],
  userId: string
): { displayValue: number; actualValue: number; newUserBoostData: UserBoostData[] } => {
  // Find or create user boost data
  const existingUserData = userBoostData.find(data => data.userId === userId);
  const userBoostCount = existingUserData ? existingUserData.boostCount : 0;
  
  // Calculate diminishing returns
  let actualValue: number;
  
  if (userBoostCount < 5) {
    // First 5 boosts: Full value
    actualValue = 1.0;
  } else if (userBoostCount < 15) {
    // Next 10 boosts: 0.5 value
    actualValue = 0.5;
  } else {
    // After 15 boosts: 0.1 value
    actualValue = 0.1;
  }
  
  // Update user boost data
  const newUserBoostData = userBoostData.map(data => 
    data.userId === userId 
      ? { ...data, boostCount: data.boostCount + 1, lastBoostTime: new Date() }
      : data
  );
  
  // Add new user if not exists
  if (!existingUserData) {
    newUserBoostData.push({
      userId,
      boostCount: 1,
      lastBoostTime: new Date()
    });
  }
  
  return {
    displayValue: 1, // Always show +1 for user satisfaction
    actualValue,
    newUserBoostData
  };
};

export const calculateEngagementDiversity = (userBoostData: UserBoostData[]): number => {
  // More unique users = higher multiplier
  const uniqueUsers = userBoostData.length;
  
  if (uniqueUsers >= 10) return 1.5;
  if (uniqueUsers >= 5) return 1.3;
  if (uniqueUsers >= 3) return 1.1;
  return 1.0;
};

export const calculateVelocityMultiplier = (
  boostEvents: any[],
  submissionAge: number
): number => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const fifteenMinutesAgo = now - (15 * 60 * 1000);
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Count boosts in different time windows
  const boosts5Min = boostEvents.filter(event => event.timestamp.getTime() > fiveMinutesAgo).length;
  const boosts15Min = boostEvents.filter(event => event.timestamp.getTime() > fifteenMinutesAgo).length;
  const boosts1Hour = boostEvents.filter(event => event.timestamp.getTime() > oneHourAgo).length;
  
  // Calculate momentum based on acceleration rather than raw velocity
  const recentMomentum = boosts5Min / 5; // boosts per minute in last 5 min
  const mediumMomentum = boosts15Min / 15; // boosts per minute in last 15 min
  const longMomentum = boosts1Hour / 60; // boosts per minute in last hour
  
  // Calculate acceleration (change in momentum)
  const shortTermAcceleration = Math.max(0, recentMomentum - mediumMomentum);
  const mediumTermAcceleration = Math.max(0, mediumMomentum - longMomentum);
  
  // Combine recent activity with acceleration for momentum score
  const momentumScore = recentMomentum + (shortTermAcceleration * 2) + (mediumTermAcceleration * 1);
  
  // Cap the momentum to prevent extreme values
  return Math.min(momentumScore, 50);
};