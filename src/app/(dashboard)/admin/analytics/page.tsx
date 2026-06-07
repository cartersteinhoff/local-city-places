"use client";

import {
  BarChart3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";

interface AnalyticsData {
  summary: {
    totalUsers: number;
    newUsers: number;
    totalMerchants: number;
    verifiedMerchants: number;
    totalReviews: number;
    nominations: number;
    confirmedSweepstakesEntries: number;
  };
  usersByRole: {
    members: number;
    merchants: number;
    admins: number;
  };
  nominationsByStatus: {
    submitted: number;
    changes_requested: number;
    approved: number;
    rejected: number;
  };
  merchantsByState: Array<{ state: string; count: number }>;
  topMerchantsByReviews: Array<{
    id: string;
    name: string;
    reviewCount: number;
  }>;
  weeklySignups: Array<{
    week: string;
    total: number;
    members: number;
    merchants: number;
  }>;
}

const emptyAnalytics: AnalyticsData = {
  summary: {
    totalUsers: 0,
    newUsers: 0,
    totalMerchants: 0,
    verifiedMerchants: 0,
    totalReviews: 0,
    nominations: 0,
    confirmedSweepstakesEntries: 0,
  },
  usersByRole: { members: 0, merchants: 0, admins: 0 },
  nominationsByStatus: {
    submitted: 0,
    changes_requested: 0,
    approved: 0,
    rejected: 0,
  },
  merchantsByState: [],
  topMerchantsByReviews: [],
  weeklySignups: [],
};

function ProgressBar({
  value,
  max,
  color = "bg-primary",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-muted">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function formatWeek(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAnalytics();
    }
  }, [authLoading, isAuthenticated, fetchAnalytics]);

  const totalRoles = Object.values(analytics.usersByRole).reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalNominationStatuses = Object.values(
    analytics.nominationsByStatus,
  ).reduce((sum, value) => sum + value, 0);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <PageHeader
              title="Analytics"
              description="Platform performance and community activity"
            />
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchAnalytics}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Users"
              value={analytics.summary.totalUsers}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              label="Verified Merchants"
              value={analytics.summary.verifiedMerchants}
              icon={Store}
              isLoading={isLoading}
            />
            <StatCard
              label="Reviews"
              value={analytics.summary.totalReviews}
              icon={MessageSquare}
              isLoading={isLoading}
            />
            <StatCard
              label="Sweepstakes Entries"
              value={analytics.summary.confirmedSweepstakesEntries}
              icon={Sparkles}
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users by Role
              </h2>
              <div className="space-y-4">
                {Object.entries(analytics.usersByRole).map(([role, count]) => (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{role}</span>
                      <span className="font-medium">
                        {count} (
                        {totalRoles > 0
                          ? Math.round((count / totalRoles) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <ProgressBar value={count} max={totalRoles} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Nominations by Status
              </h2>
              <div className="space-y-4">
                {Object.entries(analytics.nominationsByStatus).map(
                  ([status, count]) => (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">
                          {status.replace("_", " ")}
                        </span>
                        <span className="font-medium">
                          {count} (
                          {totalNominationStatuses > 0
                            ? Math.round(
                                (count / totalNominationStatuses) * 100,
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <ProgressBar
                        value={count}
                        max={totalNominationStatuses}
                        color={
                          status === "approved"
                            ? "bg-green-500"
                            : status === "rejected"
                              ? "bg-red-500"
                              : status === "changes_requested"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                        }
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Merchants by State
              </h2>
              {analytics.merchantsByState.length ? (
                <div className="space-y-3">
                  {analytics.merchantsByState.map((row) => (
                    <div key={row.state} className="flex items-center gap-3">
                      <span className="w-10 text-sm font-medium">
                        {row.state}
                      </span>
                      <ProgressBar
                        value={row.count}
                        max={analytics.merchantsByState[0].count}
                      />
                      <span className="w-10 text-right text-sm">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No merchant location data available.
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Top Merchants by Reviews
              </h2>
              {analytics.topMerchantsByReviews.length ? (
                <div className="space-y-3">
                  {analytics.topMerchantsByReviews.map((merchant, index) => (
                    <div key={merchant.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">
                          {index + 1}. {merchant.name}
                        </span>
                        <span className="font-medium ml-2">
                          {merchant.reviewCount}
                        </span>
                      </div>
                      <ProgressBar
                        value={merchant.reviewCount}
                        max={analytics.topMerchantsByReviews[0].reviewCount}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No review data available.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 mt-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Signups
            </h2>
            {analytics.weeklySignups.length ? (
              <div className="space-y-3">
                {analytics.weeklySignups.map((row) => (
                  <div key={row.week}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatWeek(row.week)}</span>
                      <span className="font-medium">{row.total}</span>
                    </div>
                    <ProgressBar
                      value={row.total}
                      max={Math.max(
                        ...analytics.weeklySignups.map((item) => item.total),
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No signups in this range.
              </p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
