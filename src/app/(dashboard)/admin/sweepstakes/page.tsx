"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";
import {
  Crown,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

interface LeaderboardRow {
  memberId: string;
  displayName: string;
  regularEntries: number;
  referralEntries: number;
  totalEntries: number;
  rank: number;
}

interface WinnerRow {
  id: string;
  prizeTier: "grand_prize" | "tier1_match" | "tier2_match";
  memberId: string;
  displayName: string;
  selectionMethod: "draw" | "manual_override";
  emailSentAt: string | null;
}

interface AdminSweepstakesResponse {
  cycle: {
    id: string;
    name: string;
    year: number;
    month: number;
    endsAt: string;
    status: string;
    grandPrizeLabel: string;
    hasEnded: boolean;
  };
  cycles: Array<{
    id: string;
    name: string;
    hasEnded: boolean;
    status: string;
  }>;
  stats: {
    participants: number;
    regularEntries: number;
    referralEntries: number;
    totalEntries: number;
  };
  winners: WinnerRow[];
  leaderboard: LeaderboardRow[];
}

function prizeTierLabel(prizeTier: WinnerRow["prizeTier"]) {
  switch (prizeTier) {
    case "grand_prize":
      return "Grand Prize";
    case "tier1_match":
      return "Tier 1 Match";
    default:
      return "Tier 2 Match";
  }
}

export default function AdminSweepstakesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [data, setData] = useState<AdminSweepstakesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [drawNotes, setDrawNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  const fetchData = useCallback(async (cycleId?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cycleId) params.set("cycleId", cycleId);

      const response = await fetch(`/api/admin/sweepstakes?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to fetch sweepstakes data");

      setData(json);
      setSelectedCycleId(json.cycle.id);
    } catch (error) {
      console.error("Failed to fetch sweepstakes admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      void fetchData();
    }
  }, [authLoading, fetchData, isAuthenticated, user?.role]);

  async function draw(winnerMemberId?: string) {
    if (!data) return;
    setProcessing(winnerMemberId || "draw");
    try {
      const response = await fetch("/api/admin/sweepstakes/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: data.cycle.id,
          winnerMemberId,
          notes: drawNotes || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to draw winners");
      await fetchData(data.cycle.id);
    } catch (error) {
      console.error("Failed to draw sweepstakes winners:", error);
      alert(error instanceof Error ? error.message : "Failed to draw winners.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <PageHeader
            title="Sweepstakes Control Room"
            description="Review the cycle leaderboard, draw a winner, and manually override the grand prize if needed."
            actions={
              <>
                <a
                  href="/admin/sweepstakes/testimonials"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Open Merchant Nominations
                </a>
                <Button variant="outline" onClick={() => void fetchData(selectedCycleId)} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <StatCard label="Participants" value={data.stats.participants} icon={Users} />
            <StatCard label="Regular Entries" value={data.stats.regularEntries} icon={Gift} />
            <StatCard label="Referral Entries" value={data.stats.referralEntries} icon={Sparkles} />
            <StatCard label="Total Entries" value={data.stats.totalEntries} icon={Trophy} />
          </div>

          <div className="rounded-xl border bg-card p-4 mb-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected cycle</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <select
                    value={selectedCycleId}
                    onChange={(event) => {
                      setSelectedCycleId(event.target.value);
                      void fetchData(event.target.value);
                    }}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {data.cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    Ends {new Date(data.cycle.endsAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full xl:w-[420px]">
                <p className="text-sm font-medium">Draw / override notes</p>
                <Textarea
                  value={drawNotes}
                  onChange={(event) => setDrawNotes(event.target.value)}
                  className="mt-2 min-h-[100px]"
                  placeholder="Optional note for why you drew now or why you overrode the grand-prize winner."
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
                  <p className="text-sm text-muted-foreground">
                    {data.cycle.hasEnded
                      ? "Drawing or overriding this cycle will trigger winner emails."
                      : "This cycle is still open. Drawing is locked until the end time passes."}
                  </p>
                  <Button
                    onClick={() => void draw()}
                    disabled={!data.cycle.hasEnded || processing !== null || data.leaderboard.length === 0}
                  >
                    {processing === "draw" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Drawing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Draw Winner
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {data.winners.length > 0 && (
            <div className="rounded-xl border bg-card p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Active winner set</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {data.winners.map((winner) => (
                  <div key={winner.id} className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {prizeTierLabel(winner.prizeTier)}
                    </p>
                    <p className="font-semibold mt-2">{winner.displayName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {winner.selectionMethod === "manual_override" ? "Manual override" : "Random draw"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {winner.emailSentAt
                        ? `Email sent ${new Date(winner.emailSentAt).toLocaleString()}`
                        : "Winner email not yet confirmed"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-4 border-b">
              <h2 className="text-lg font-semibold">Leaderboard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Regular entries, referral entries, and combined totals for the selected cycle.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3">Rank</th>
                    <th className="text-left px-4 py-3">Member</th>
                    <th className="text-right px-4 py-3">Regular</th>
                    <th className="text-right px-4 py-3">Referral</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No leaderboard data yet for this cycle.
                      </td>
                    </tr>
                  ) : (
                    data.leaderboard.map((row) => (
                      <tr key={row.memberId} className="border-t">
                        <td className="px-4 py-3 font-medium">#{row.rank}</td>
                        <td className="px-4 py-3">{row.displayName}</td>
                        <td className="px-4 py-3 text-right">{row.regularEntries}</td>
                        <td className="px-4 py-3 text-right">{row.referralEntries}</td>
                        <td className="px-4 py-3 text-right font-medium">{row.totalEntries}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void draw(row.memberId)}
                            disabled={!data.cycle.hasEnded || processing !== null}
                          >
                            {processing === row.memberId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Selecting...
                              </>
                            ) : (
                              "Set as Grand Winner"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
