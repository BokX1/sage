import { config } from '../config/env';

const limits = new Map<string, number[]>();

export function isRateLimited(channelId: string): boolean {
  const now = Date.now();
  const windowMs = Number(config.rateLimitWindowSec || 10) * 1000;
  const max = Number(config.rateLimitMax || 5);

  const timestamps = limits.get(channelId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= max) {
    return true;
  }

  validTimestamps.push(now);
  limits.set(channelId, validTimestamps);
  return false;
}

export function isSeriousMode(): boolean {
  return config.seriousMode === 'true';
}

export const autopilot = {
  level: config.autopilotLevel || 'cautious',
  silenceGraceSec: Number(config.silenceGraceSec || 60),
};
