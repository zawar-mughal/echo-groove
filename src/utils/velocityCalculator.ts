import { BoostEvent, VelocityMetrics } from '@/types/submission';

export class VelocityCalculator {
  private static readonly TIME_WINDOWS = {
    FIVE_MIN: 5 * 60 * 1000,    // 5 minutes
    FIFTEEN_MIN: 15 * 60 * 1000, // 15 minutes
    ONE_HOUR: 60 * 60 * 1000     // 1 hour
  };

  static calculateVelocity(boostEvents: BoostEvent[]): VelocityMetrics {
    const now = new Date();
    const sortedEvents = boostEvents
      .filter(event => event.timestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Calculate boosts per minute for different time windows
    const boostsPerMinute5Min = this.calculateBoostsPerMinute(sortedEvents, now, this.TIME_WINDOWS.FIVE_MIN);
    const boostsPerMinute15Min = this.calculateBoostsPerMinute(sortedEvents, now, this.TIME_WINDOWS.FIFTEEN_MIN);
    const boostsPerMinute1Hr = this.calculateBoostsPerMinute(sortedEvents, now, this.TIME_WINDOWS.ONE_HOUR);

    // Calculate trend and momentum
    const { trend, momentum } = this.calculateTrend(sortedEvents, now);

    return {
      boostsPerMinute5Min,
      boostsPerMinute15Min,
      boostsPerMinute1Hr,
      trend,
      momentum
    };
  }

  private static calculateBoostsPerMinute(events: BoostEvent[], now: Date, timeWindow: number): number {
    const cutoffTime = now.getTime() - timeWindow;
    const recentEvents = events.filter(event => event.timestamp.getTime() >= cutoffTime);
    const minutes = timeWindow / (1000 * 60);
    return recentEvents.length / minutes;
  }

  private static calculateTrend(events: BoostEvent[], now: Date): { trend: 'rising' | 'steady' | 'declining', momentum: number } {
    if (events.length < 2) {
      return { trend: 'steady', momentum: 0 };
    }

    // Compare recent 5min vs previous 5min
    const recent5Min = this.calculateBoostsPerMinute(events, now, this.TIME_WINDOWS.FIVE_MIN);
    const previous5Min = this.calculateBoostsPerMinute(
      events, 
      new Date(now.getTime() - this.TIME_WINDOWS.FIVE_MIN), 
      this.TIME_WINDOWS.FIVE_MIN
    );

    const momentum = recent5Min - previous5Min;
    
    if (momentum > 0.5) return { trend: 'rising', momentum };
    if (momentum < -0.5) return { trend: 'declining', momentum };
    return { trend: 'steady', momentum };
  }

  static determineRisingStatus(metrics: VelocityMetrics, submissionAge: number): {
    isRising: boolean;
    risingType?: 'hot' | 'trending' | 'rising-fast';
  } {
    const { boostsPerMinute5Min, boostsPerMinute15Min, trend } = metrics;

    // Thresholds adjust based on submission age (newer submissions need less velocity to be "rising")
    const ageHours = submissionAge / (1000 * 60 * 60);
    const ageFactor = Math.max(0.3, 1 - (ageHours / 24)); // Boost newer submissions

    // Rising fast: high recent velocity
    if (boostsPerMinute5Min >= 2 * ageFactor && trend === 'rising') {
      return { isRising: true, risingType: 'rising-fast' };
    }

    // Hot: consistent high velocity
    if (boostsPerMinute15Min >= 1 * ageFactor && boostsPerMinute5Min >= 0.8 * ageFactor) {
      return { isRising: true, risingType: 'hot' };
    }

    // Trending: good sustained velocity
    if (boostsPerMinute15Min >= 0.5 * ageFactor && trend !== 'declining') {
      return { isRising: true, risingType: 'trending' };
    }

    return { isRising: false };
  }

  static canUserBoost(usersBoosted: Set<string>, userId: string): boolean {
    return !usersBoosted.has(userId);
  }
}