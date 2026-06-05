"use client";

import { Copy, Gift, Loader2, Sparkles, Ticket, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { memberNavItems } from "./nav";

interface SweepstakesDashboardData {
  cycle: {
    id: string;
    name: string;
    year: number;
    month: number;
    endsAt: string | null;
    grandPrizeLabel: string;
  };
  cycleEntry: {
    id: string;
    status: string;
    confirmedAt: string | null;
  } | null;
  confirmedEntriesThisMonth: number;
  activatedReferrals: number;
  combinedEntriesThisMonth: number;
  referralCode: string;
  referralLink: string;
  currentStanding: {
    memberId: string;
    displayName: string;
    regularEntries: number;
    referralEntries: number;
    totalEntries: number;
    rank: number;
  } | null;
  leaderboardPreview: Array<{
    memberId: string;
    displayName: string;
    regularEntries: number;
    referralEntries: number;
    totalEntries: number;
    rank: number;
  }>;
  winners: Array<{
    id: string;
    prizeTier: "grand_prize" | "tier1_match" | "tier2_match";
    memberId: string;
    displayName: string;
    selectionMethod: "draw" | "manual_override";
    emailSentAt: string | null;
  }>;
}

function MemberDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sweepstakesStatus = searchParams.get("sweepstakes");
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [sweepstakesData, setSweepstakesData] =
    useState<SweepstakesDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || (user?.role !== "member" && user?.role !== "admin"))
    ) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetch("/api/member/sweepstakes")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setSweepstakesData(data);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch sweepstakes data:", error);
        })
        .finally(() => setDataLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const handleCopyReferralLink = async () => {
    if (!sweepstakesData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(sweepstakesData.referralLink);
      setCopiedReferralLink(true);
      window.setTimeout(() => setCopiedReferralLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
    }
  };

  return (
    <DashboardLayout navItems={memberNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Member Dashboard"
            description="Nominate favorite local businesses and track your sweepstakes activity"
          />

          {sweepstakesStatus === "account-created" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="font-semibold text-amber-900">
                Your member account is ready.
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Submit your first favorite merchant nomination to lock in your
                sweepstakes entry for this cycle.
              </p>
            </div>
          )}

          {sweepstakesStatus === "entry-confirmed" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="font-semibold text-green-900">
                Your sweepstakes entry is locked in.
              </p>
              <p className="text-sm text-green-800 mt-1">
                Keep sharing your referral link and nominating local merchants
                this cycle.
              </p>
            </div>
          )}

          {sweepstakesData && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Favorite Merchant Sweepstakes
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sweepstakesData.cycle.name} ·{" "}
                      {sweepstakesData.cycle.grandPrizeLabel}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                      sweepstakesData.cycleEntry
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-800",
                    )}
                  >
                    {sweepstakesData.cycleEntry
                      ? "Entry locked in"
                      : "Entry starts with your first nomination"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                  <StatCard
                    label="Cycle Entry"
                    value={
                      sweepstakesData.cycleEntry?.status === "confirmed"
                        ? "Confirmed"
                        : "Awaiting nomination"
                    }
                    icon={Ticket}
                  />
                  <StatCard
                    label="Entries This Cycle"
                    value={sweepstakesData.confirmedEntriesThisMonth}
                    icon={Sparkles}
                  />
                  <StatCard
                    label="Activated Referrals"
                    value={sweepstakesData.activatedReferrals}
                    icon={Users}
                  />
                  <StatCard
                    label="Total Entries"
                    value={sweepstakesData.combinedEntriesThisMonth}
                    icon={Gift}
                  />
                </div>

                <div className="rounded-xl border bg-muted/30 p-4 mt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Your referral link</p>
                      <p className="text-sm text-muted-foreground mt-1 break-all">
                        {sweepstakesData.referralLink}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleCopyReferralLink}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedReferralLink ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {sweepstakesData.cycleEntry
                      ? "Your entry is locked in. Keep sharing your link so referrals can activate under your name."
                      : "Submit your first favorite merchant nomination this cycle to lock in your entry."}
                  </p>
                  <a
                    href="/member/sweepstakes/testimonials/new"
                    className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {sweepstakesData.cycleEntry
                      ? "Manage Nominations"
                      : "Nominate a Favorite Merchant"}
                  </a>
                </div>
              </div>

              {sweepstakesData.currentStanding && (
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Your leaderboard standing
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rank #{sweepstakesData.currentStanding.rank} this cycle
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border px-3 py-2 text-center">
                        <p className="text-muted-foreground">Regular</p>
                        <p className="font-semibold mt-1">
                          {sweepstakesData.currentStanding.regularEntries}
                        </p>
                      </div>
                      <div className="rounded-lg border px-3 py-2 text-center">
                        <p className="text-muted-foreground">Referral</p>
                        <p className="font-semibold mt-1">
                          {sweepstakesData.currentStanding.referralEntries}
                        </p>
                      </div>
                      <div className="rounded-lg border px-3 py-2 text-center">
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold mt-1">
                          {sweepstakesData.currentStanding.totalEntries}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold">Leaderboard</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Regular entries and activated referral entries both count.
                </p>

                {sweepstakesData.leaderboardPreview.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="text-left py-2 pr-3">Rank</th>
                          <th className="text-left py-2 pr-3">Member</th>
                          <th className="text-right py-2 pr-3">Regular</th>
                          <th className="text-right py-2 pr-3">Referral</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sweepstakesData.leaderboardPreview.map((row) => (
                          <tr
                            key={row.memberId}
                            className={cn(
                              "border-b last:border-0",
                              sweepstakesData.currentStanding?.memberId ===
                                row.memberId && "bg-amber-50",
                            )}
                          >
                            <td className="py-3 pr-3 font-medium">
                              #{row.rank}
                            </td>
                            <td className="py-3 pr-3">{row.displayName}</td>
                            <td className="py-3 pr-3 text-right">
                              {row.regularEntries}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              {row.referralEntries}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {row.totalEntries}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 mt-4 text-sm text-muted-foreground">
                    No leaderboard data yet for this cycle.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default function MemberDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <MemberDashboardContent />
    </Suspense>
  );
}
