"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Receipt,
  Gift,
  Store,
  ShoppingCart,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface AnalyticsData {
  summary: {
    totalUsers: { value: number; change: number };
    activeGrcs: { value: number; change: number };
    totalReceipts: { value: number; change: number };
    giftCardsSent: { value: number; change: number };
  };
  usersByRole: {
    members: number;
    merchants: number;
    admins: number;
  };
  grcsByStatus: {
    pending: number;
    active: number;
    completed: number;
    expired: number;
  };
  receiptsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  topMerchants: Array<{ id: string; name: string; activeGrcs: number }>;
  topGroceryStores: Array<{ name: string; receiptCount: number }>;
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function StatWithChange({ label, value, change, icon: Icon }: {
  label: string;
  value: number | string;
  change: number;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 md:p-6 bg-card rounded-xl border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-sm">
        {change >= 0 ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
          {change >= 0 ? "+" : ""}{change}%
        </span>
        <span className="text-muted-foreground">vs previous period</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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
  }, [authLoading, isAuthenticated, dateRange]);

  const totalUsers = analytics
    ? analytics.usersByRole.members + analytics.usersByRole.merchants + analytics.usersByRole.admins
    : 0;

  const totalGrcs = analytics
    ? analytics.grcsByStatus.pending + analytics.grcsByStatus.active + analytics.grcsByStatus.completed + analytics.grcsByStatus.expired
    : 0;

  const totalReceipts = analytics
    ? analytics.receiptsByStatus.pending + analytics.receiptsByStatus.approved + analytics.receiptsByStatus.rejected
    : 0;

  const maxMerchantGrcs = analytics?.topMerchants[0]?.activeGrcs || 1;
  const maxStoreReceipts = analytics?.topGroceryStores[0]?.receiptCount || 1;

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              title="Analytics"
              description="Platform performance and insights"
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
              <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-card border rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-card border rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatWithChange
                  label="Total Users"
                  value={analytics.summary.totalUsers.value}
                  change={analytics.summary.totalUsers.change}
                  icon={Users}
                />
                <StatWithChange
                  label="Active GRCs"
                  value={analytics.summary.activeGrcs.value}
                  change={analytics.summary.activeGrcs.change}
                  icon={CreditCard}
                />
                <StatWithChange
                  label="Total Receipts"
                  value={analytics.summary.totalReceipts.value}
                  change={analytics.summary.totalReceipts.change}
                  icon={Receipt}
                />
                <StatWithChange
                  label="Gift Cards Sent"
                  value={analytics.summary.giftCardsSent.value}
                  change={analytics.summary.giftCardsSent.change}
                  icon={Gift}
                />
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Users by Role</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Members</span>
                        <span className="font-medium">
                          {analytics.usersByRole.members} ({totalUsers > 0 ? Math.round((analytics.usersByRole.members / totalUsers) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.usersByRole.members} max={totalUsers} color="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Merchants</span>
                        <span className="font-medium">
                          {analytics.usersByRole.merchants} ({totalUsers > 0 ? Math.round((analytics.usersByRole.merchants / totalUsers) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.usersByRole.merchants} max={totalUsers} color="bg-amber-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Admins</span>
                        <span className="font-medium">
                          {analytics.usersByRole.admins} ({totalUsers > 0 ? Math.round((analytics.usersByRole.admins / totalUsers) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.usersByRole.admins} max={totalUsers} color="bg-purple-500" />
                    </div>
                  </div>
                </div>

                {/* GRCs by Status */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">GRCs by Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active</span>
                        <span className="font-medium">
                          {analytics.grcsByStatus.active} ({totalGrcs > 0 ? Math.round((analytics.grcsByStatus.active / totalGrcs) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.grcsByStatus.active} max={totalGrcs} color="bg-green-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pending</span>
                        <span className="font-medium">
                          {analytics.grcsByStatus.pending} ({totalGrcs > 0 ? Math.round((analytics.grcsByStatus.pending / totalGrcs) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.grcsByStatus.pending} max={totalGrcs} color="bg-yellow-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completed</span>
                        <span className="font-medium">
                          {analytics.grcsByStatus.completed} ({totalGrcs > 0 ? Math.round((analytics.grcsByStatus.completed / totalGrcs) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.grcsByStatus.completed} max={totalGrcs} color="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Expired</span>
                        <span className="font-medium">
                          {analytics.grcsByStatus.expired} ({totalGrcs > 0 ? Math.round((analytics.grcsByStatus.expired / totalGrcs) * 100) : 0}%)
                        </span>
                      </div>
                      <ProgressBar value={analytics.grcsByStatus.expired} max={totalGrcs} color="bg-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Approval Rate */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Receipt Approval Rate</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Approved</span>
                      <span className="font-medium text-green-600">
                        {totalReceipts > 0 ? Math.round((analytics.receiptsByStatus.approved / totalReceipts) * 100) : 0}% ({analytics.receiptsByStatus.approved})
                      </span>
                    </div>
                    <ProgressBar value={analytics.receiptsByStatus.approved} max={totalReceipts} color="bg-green-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pending</span>
                      <span className="font-medium text-yellow-600">
                        {totalReceipts > 0 ? Math.round((analytics.receiptsByStatus.pending / totalReceipts) * 100) : 0}% ({analytics.receiptsByStatus.pending})
                      </span>
                    </div>
                    <ProgressBar value={analytics.receiptsByStatus.pending} max={totalReceipts} color="bg-yellow-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rejected</span>
                      <span className="font-medium text-red-600">
                        {totalReceipts > 0 ? Math.round((analytics.receiptsByStatus.rejected / totalReceipts) * 100) : 0}% ({analytics.receiptsByStatus.rejected})
                      </span>
                    </div>
                    <ProgressBar value={analytics.receiptsByStatus.rejected} max={totalReceipts} color="bg-red-500" />
                  </div>
                </div>
              </div>

              {/* Leaderboards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Merchants */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Top Merchants by Active GRCs
                  </h3>
                  {analytics.topMerchants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No merchants with active GRCs</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topMerchants.map((merchant, index) => (
                        <div key={merchant.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate">
                              {index + 1}. {merchant.name}
                            </span>
                            <span className="font-medium ml-2">{merchant.activeGrcs} GRCs</span>
                          </div>
                          <ProgressBar value={merchant.activeGrcs} max={maxMerchantGrcs} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Grocery Stores */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Top Grocery Stores
                  </h3>
                  {analytics.topGroceryStores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No grocery store data available</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topGroceryStores.map((store, index) => (
                        <div key={store.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate">
                              {index + 1}. {store.name}
                            </span>
                            <span className="font-medium ml-2">{store.receiptCount} receipts</span>
                          </div>
                          <ProgressBar value={store.receiptCount} max={maxStoreReceipts} color="bg-emerald-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load analytics data
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
