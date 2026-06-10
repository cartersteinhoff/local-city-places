export const MERCHANT_TRIAL_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MerchantTrialProgress {
  day: number;
  totalDays: number;
  startedAt: string;
  endsAt: string;
}

export function getMerchantTrialProgress(
  usedAt: Date | string | null | undefined,
): MerchantTrialProgress | null {
  if (!usedAt) return null;

  const now = new Date();
  const startedAt = new Date(usedAt);
  const endsAt = new Date(startedAt.getTime() + MERCHANT_TRIAL_DAYS * DAY_MS);
  const elapsedMs = now.getTime() - startedAt.getTime();

  if (elapsedMs < 0 || now.getTime() >= endsAt.getTime()) {
    return null;
  }

  return {
    day: Math.min(MERCHANT_TRIAL_DAYS, Math.floor(elapsedMs / DAY_MS) + 1),
    totalDays: MERCHANT_TRIAL_DAYS,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}
