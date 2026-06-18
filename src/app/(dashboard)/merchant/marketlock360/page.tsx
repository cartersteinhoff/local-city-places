import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { normalizeMarketLockStatus } from "@/lib/market-lock-status";
import {
  formatMarketLock360Amount,
  getMarketLock360MonthlyAmountCents,
} from "@/lib/marketlock360-pricing";
import { MarketLock360Content } from "./marketlock360-content";
import { MarketLock360DashboardShell } from "./marketlock360-dashboard-shell";

export default async function MerchantMarketLock360Page() {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    redirect("/");
  }

  const amountCents = getMarketLock360MonthlyAmountCents();

  return (
    <MarketLock360DashboardShell>
      <MarketLock360Content
        initialStatus={normalizeMarketLockStatus(
          session.merchant?.marketLockStatus,
        )}
        monthlyPaymentLabel={
          amountCents ? formatMarketLock360Amount(amountCents) : undefined
        }
      />
    </MarketLock360DashboardShell>
  );
}
