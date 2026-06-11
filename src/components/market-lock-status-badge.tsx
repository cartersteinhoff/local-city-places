import {
  getMarketLockStatusLabel,
  type MarketLockStatus,
  normalizeMarketLockStatus,
} from "@/lib/market-lock-status";
import { cn } from "@/lib/utils";

const statusClassName: Record<MarketLockStatus, string> = {
  basic:
    "border-slate-300/70 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-400/10 dark:text-slate-200",
  trial:
    "border-orange-300/70 bg-orange-100 text-orange-800 dark:border-orange-400/35 dark:bg-orange-400/10 dark:text-orange-200",
  pro: "border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-200",
};

interface MarketLockStatusBadgeProps {
  status?: MarketLockStatus | null;
  className?: string;
}

export function MarketLockStatusBadge({
  status,
  className,
}: MarketLockStatusBadgeProps) {
  const normalizedStatus = normalizeMarketLockStatus(status);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase leading-none",
        statusClassName[normalizedStatus],
        className,
      )}
    >
      {getMarketLockStatusLabel(normalizedStatus)}
    </span>
  );
}
