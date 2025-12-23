"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Receipt,
  Gift,
  Store,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Package,
  UserCheck,
  UserX,
  Activity,
  CreditCard,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  // Phase 1
  revenue: {
    total: number;
    pending: number;
    byDenomination: Array<{ denomination: number; total: number; count: number }>;
    byPaymentMethod: Array<{ method: string; total: number; count: number }>;
    trialConversion: { trialMerchants: number; convertedMerchants: number };
  };
  qualificationFunnel: {
    activeGrcs: number;
    withReceipts: number;
    qualified: number;
    rewardsSent: number;
  };
  rejectionBreakdown: {
    reasons: Array<{ reason: string; count: number }>;
    flags: { storeMismatch: number; dateMismatch: number; memberOverride: number };
  };
  pendingActions: {
    receipts: number;
    payments: number;
    rewards: number;
    unverifiedMerchants: number;
    flaggedReceipts: number;
  };
  memberEngagement: {
    totalWithActiveGrc: number;
    active: number;
    atRisk: number;
    newThisPeriod: number;
  };

  // Phase 2
  timeSeries: {
    receipts: Array<{ week: string; total: number; approved: number; rejected: number }>;
    revenue: Array<{ week: string; total: number; count: number }>;
    signups: Array<{ week: string; total: number; members: number; merchants: number }>;
  };
  geographic: {
    membersByState: Array<{ state: string; count: number }>;
    merchantsByState: Array<{ state: string; count: number }>;
  };
  merchantHealth: {
    verified: number;
    unverified: number;
    inventoryTiers: { zero: number; low: number; healthy: number };
    inactiveMerchants: number;
  };
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

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-right">{label}</div>
      <div className="flex-1 h-8 bg-muted rounded relative overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          {value.toLocaleString()} ({percentage.toFixed(0)}%)
        </div>
      </div>
    </div>
  );
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);

const formatWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899"];

const emptyAnalytics: AnalyticsData = {
  summary: {
    totalUsers: { value: 0, change: 0 },
    activeGrcs: { value: 0, change: 0 },
    totalReceipts: { value: 0, change: 0 },
    giftCardsSent: { value: 0, change: 0 },
  },
  usersByRole: { members: 0, merchants: 0, admins: 0 },
  grcsByStatus: { pending: 0, active: 0, completed: 0, expired: 0 },
  receiptsByStatus: { pending: 0, approved: 0, rejected: 0 },
  topMerchants: [],
  topGroceryStores: [],
  revenue: {
    total: 0,
    pending: 0,
    byDenomination: [],
    byPaymentMethod: [],
    trialConversion: { trialMerchants: 0, convertedMerchants: 0 },
  },
  qualificationFunnel: { activeGrcs: 0, withReceipts: 0, qualified: 0, rewardsSent: 0 },
  rejectionBreakdown: {
    reasons: [],
    flags: { storeMismatch: 0, dateMismatch: 0, memberOverride: 0 },
  },
  pendingActions: { receipts: 0, payments: 0, rewards: 0, unverifiedMerchants: 0, flaggedReceipts: 0 },
  memberEngagement: { totalWithActiveGrc: 0, active: 0, atRisk: 0, newThisPeriod: 0 },
  timeSeries: { receipts: [], revenue: [], signups: [] },
  geographic: { membersByState: [], merchantsByState: [] },
  merchantHealth: { verified: 0, unverified: 0, inventoryTiers: { zero: 0, low: 0, healthy: 0 }, inactiveMerchants: 0 },
};

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
  }, [authLoading, isAuthenticated, dateRange]);

  const totalPendingActions = analytics
    ? analytics.pendingActions.receipts +
      analytics.pendingActions.payments +
      analytics.pendingActions.rewards +
      analytics.pendingActions.flaggedReceipts
    : 0;

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

          {/* Pending Actions Alert - Always visible */}
          {totalPendingActions > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  {totalPendingActions} items need attention
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {analytics.pendingActions.receipts > 0 && (
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>{analytics.pendingActions.receipts} receipts</span>
                  </div>
                )}
                {analytics.pendingActions.payments > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>{analytics.pendingActions.payments} payments</span>
                  </div>
                )}
                {analytics.pendingActions.rewards > 0 && (
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>{analytics.pendingActions.rewards} rewards</span>
                  </div>
                )}
                {analytics.pendingActions.flaggedReceipts > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{analytics.pendingActions.flaggedReceipts} flagged</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Revenue Summary */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Overview
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.revenue.total)}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(analytics.revenue.pending)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Trial Merchants</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.revenue.trialConversion.trialMerchants}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Trial Conversions</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.revenue.trialConversion.trialMerchants > 0
                        ? `${Math.round((analytics.revenue.trialConversion.convertedMerchants / analytics.revenue.trialConversion.trialMerchants) * 100)}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {analytics.revenue.byDenomination.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">By Denomination</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.revenue.byDenomination.map((d) => (
                        <div key={d.denomination} className="bg-muted rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium">${d.denomination}</span>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span>{d.count} orders</span>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span className="text-green-600">{formatCurrency(d.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.revenue.byPaymentMethod.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">By Payment Method</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.revenue.byPaymentMethod.map((p) => (
                        <div key={p.method} className="bg-muted rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium capitalize">{p.method.replace("_", " ")}</span>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span>{p.count} orders</span>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span className="text-green-600">{formatCurrency(p.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Qualification Funnel */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Qualification Funnel
                  </h3>
                  <div className="space-y-3">
                    <FunnelBar label="Active GRCs" value={analytics.qualificationFunnel.activeGrcs} max={analytics.qualificationFunnel.activeGrcs} color="bg-blue-500" />
                    <FunnelBar label="With Receipts" value={analytics.qualificationFunnel.withReceipts} max={analytics.qualificationFunnel.activeGrcs} color="bg-indigo-500" />
                    <FunnelBar label="Qualified" value={analytics.qualificationFunnel.qualified} max={analytics.qualificationFunnel.activeGrcs} color="bg-purple-500" />
                    <FunnelBar label="Rewards Sent" value={analytics.qualificationFunnel.rewardsSent} max={analytics.qualificationFunnel.activeGrcs} color="bg-green-500" />
                  </div>
                </div>

                {/* Member Engagement */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Member Engagement
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{analytics.memberEngagement.totalWithActiveGrc}</p>
                      <p className="text-sm text-muted-foreground">With Active GRC</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">{analytics.memberEngagement.active}</p>
                      <p className="text-sm text-muted-foreground">Active (30d)</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-600">{analytics.memberEngagement.atRisk}</p>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">{analytics.memberEngagement.newThisPeriod}</p>
                      <p className="text-sm text-muted-foreground">New This Period</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users by Role & GRCs by Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Users by Role</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.usersByRole).map(([role, count]) => {
                      const totalUsers = Object.values(analytics.usersByRole).reduce((a, b) => a + b, 0);
                      const colors: Record<string, string> = { members: "bg-blue-500", merchants: "bg-amber-500", admins: "bg-purple-500" };
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{role}</span>
                            <span className="font-medium">{count} ({totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%)</span>
                          </div>
                          <ProgressBar value={count} max={totalUsers} color={colors[role]} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">GRCs by Status</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.grcsByStatus).map(([status, count]) => {
                      const totalGrcs = Object.values(analytics.grcsByStatus).reduce((a, b) => a + b, 0);
                      const colors: Record<string, string> = { pending: "bg-yellow-500", active: "bg-green-500", completed: "bg-blue-500", expired: "bg-red-500" };
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{status}</span>
                            <span className="font-medium">{count} ({totalGrcs > 0 ? Math.round((count / totalGrcs) * 100) : 0}%)</span>
                          </div>
                          <ProgressBar value={count} max={totalGrcs} color={colors[status]} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Weekly Receipt Activity</h3>
                  {analytics.timeSeries.receipts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={analytics.timeSeries.receipts}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tickFormatter={formatWeek} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip labelFormatter={formatWeek} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Legend />
                        <Area type="monotone" dataKey="approved" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Approved" />
                        <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Rejected" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
                  )}
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Weekly Signups</h3>
                  {analytics.timeSeries.signups.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.timeSeries.signups}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tickFormatter={formatWeek} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip labelFormatter={formatWeek} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Legend />
                        <Bar dataKey="members" fill="#3b82f6" name="Members" />
                        <Bar dataKey="merchants" fill="#8b5cf6" name="Merchants" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Weekly Revenue</h3>
                {analytics.timeSeries.revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.timeSeries.revenue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" tickFormatter={formatWeek} className="text-xs" />
                      <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                      <Tooltip labelFormatter={formatWeek} formatter={(value: number) => [formatCurrency(value), "Revenue"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </div>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rejection Breakdown */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Receipt Rejection Reasons
                  </h3>
                  {analytics.rejectionBreakdown.reasons.length > 0 ? (
                    <div className="flex gap-4 mb-4">
                      <ResponsiveContainer width="50%" height={180}>
                        <PieChart>
                          <Pie data={analytics.rejectionBreakdown.reasons} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={70} label={false}>
                            {analytics.rejectionBreakdown.reasons.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {analytics.rejectionBreakdown.reasons.map((r, i) => (
                          <div key={r.reason} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="flex-1 truncate">{r.reason}</span>
                            <span className="font-medium">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No rejections recorded</p>
                  )}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Receipt Flags</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Store className="w-4 h-4 text-orange-500" />
                        <span>{analytics.rejectionBreakdown.flags.storeMismatch} store mismatches</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span>{analytics.rejectionBreakdown.flags.dateMismatch} date mismatches</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>{analytics.rejectionBreakdown.flags.memberOverride} member overrides</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Merchant Health */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Merchant Health
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <UserCheck className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">{analytics.merchantHealth.verified}</p>
                      <p className="text-sm text-muted-foreground">Verified</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                      <UserX className="w-6 h-6 mx-auto mb-1 text-gray-500" />
                      <p className="text-2xl font-bold text-gray-600">{analytics.merchantHealth.unverified}</p>
                      <p className="text-sm text-muted-foreground">Unverified</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Inventory Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>No Inventory</span>
                        </div>
                        <span className="font-medium">{analytics.merchantHealth.inventoryTiers.zero}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span>Low (1-3)</span>
                        </div>
                        <span className="font-medium">{analytics.merchantHealth.inventoryTiers.low}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Healthy (4+)</span>
                        </div>
                        <span className="font-medium">{analytics.merchantHealth.inventoryTiers.healthy}</span>
                      </div>
                    </div>
                    {analytics.merchantHealth.inactiveMerchants > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-sm text-amber-800 dark:text-amber-200">
                        {analytics.merchantHealth.inactiveMerchants} merchant(s) purchased but never issued GRCs
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Geographic Tab */}
            <TabsContent value="geographic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Members by State
                  </h3>
                  {analytics.geographic.membersByState.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.geographic.membersByState.map((s, i) => (
                        <div key={s.state} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium">{s.state}</span>
                          <div className="flex-1">
                            <ProgressBar value={s.count} max={analytics.geographic.membersByState[0].count} color={i === 0 ? "bg-blue-500" : "bg-blue-300"} />
                          </div>
                          <span className="w-10 text-sm text-right">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No geographic data available</p>
                  )}
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Merchants by State
                  </h3>
                  {analytics.geographic.merchantsByState.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.geographic.merchantsByState.map((s, i) => (
                        <div key={s.state} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium">{s.state}</span>
                          <div className="flex-1">
                            <ProgressBar value={s.count} max={analytics.geographic.merchantsByState[0].count} color={i === 0 ? "bg-purple-500" : "bg-purple-300"} />
                          </div>
                          <span className="w-10 text-sm text-right">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No geographic data available</p>
                  )}
                </div>
              </div>

              {/* Leaderboards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            <span className="truncate">{index + 1}. {merchant.name}</span>
                            <span className="font-medium ml-2">{merchant.activeGrcs} GRCs</span>
                          </div>
                          <ProgressBar value={merchant.activeGrcs} max={analytics.topMerchants[0].activeGrcs} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                            <span className="truncate">{index + 1}. {store.name}</span>
                            <span className="font-medium ml-2">{store.receiptCount} receipts</span>
                          </div>
                          <ProgressBar value={store.receiptCount} max={analytics.topGroceryStores[0].receiptCount} color="bg-emerald-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
}
