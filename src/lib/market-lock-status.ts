export const MARKET_LOCK_STATUSES = ["basic", "trial", "pro"] as const;

export type MarketLockStatus = (typeof MARKET_LOCK_STATUSES)[number];

export const MARKET_LOCK_STATUS_LABELS: Record<MarketLockStatus, string> = {
  basic: "Basic",
  trial: "Trial",
  pro: "Pro",
};

export function isMarketLockStatus(value: unknown): value is MarketLockStatus {
  return (
    typeof value === "string" &&
    MARKET_LOCK_STATUSES.includes(value as MarketLockStatus)
  );
}

export function normalizeMarketLockStatus(value: unknown): MarketLockStatus {
  return isMarketLockStatus(value) ? value : "basic";
}

export function getMarketLockStatusLabel(status: unknown): string {
  return MARKET_LOCK_STATUS_LABELS[normalizeMarketLockStatus(status)];
}
