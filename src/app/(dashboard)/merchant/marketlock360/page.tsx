import { redirect } from "next/navigation";
import { MarketLock360Content } from "@/app/(marketing)/marketlock360/page";
import { getSession } from "@/lib/auth";
import { MarketLock360DashboardShell } from "./marketlock360-dashboard-shell";

export default async function MerchantMarketLock360Page() {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    redirect("/");
  }

  return (
    <MarketLock360DashboardShell>
      <MarketLock360Content surface="dashboard" />
    </MarketLock360DashboardShell>
  );
}
