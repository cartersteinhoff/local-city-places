"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  Receipt,
  Gift,
  UserCircle,
  FileCheck,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface DashboardStats {
  pendingReceipts: number;
  giftCardsPending: number;
  activeMembers: number;
  activeMerchants: number;
}

interface ActivityItem {
  type: string;
  memberName?: string;
  merchantName?: string;
  adminName?: string;
  amount?: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const fetchDashboardData = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      fetchDashboardData();
    }
  }, [loading, isAuthenticated, user?.role]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "receipt_submitted":
        return <Receipt className="w-4 h-4 text-blue-500" />;
      case "grc_registered":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "receipt_approved":
        return <FileCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Receipt className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityMessage = (item: ActivityItem) => {
    switch (item.type) {
      case "receipt_submitted":
        return (
          <>
            <span className="font-medium">{item.memberName}</span> submitted a receipt
            {item.amount && <span className="text-muted-foreground"> (${item.amount})</span>}
          </>
        );
      case "grc_registered":
        return (
          <>
            <span className="font-medium">{item.memberName}</span> registered with{" "}
            <span className="font-medium">{item.merchantName}</span>
          </>
        );
      case "receipt_approved":
        return (
          <>
            <span className="font-medium">{item.adminName}</span> approved{" "}
            <span className="font-medium">{item.memberName}&apos;s</span> receipt
          </>
        );
      default:
        return "Unknown activity";
    }
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Admin Dashboard"
            description="Manage members, merchants, and platform operations"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Pending Receipts"
              value={stats?.pendingReceipts ?? 0}
              icon={Receipt}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Gift Cards Pending"
              value={stats?.giftCardsPending ?? 0}
              icon={Gift}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Active Members"
              value={stats?.activeMembers ?? 0}
              icon={UserCircle}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Active Merchants"
              value={stats?.activeMerchants ?? 0}
              icon={Users}
              isLoading={isLoadingStats}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/moderation"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Review Receipts</p>
                  <p className="text-sm text-muted-foreground">Approve or reject pending submissions</p>
                </div>
              </a>
              <a
                href="/admin/gift-cards"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Fulfill Gift Cards</p>
                  <p className="text-sm text-muted-foreground">Send rewards to qualified members</p>
                </div>
              </a>
              <a
                href="/admin/users"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View and edit user accounts</p>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDashboardData}
                disabled={isLoadingStats}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStats ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {isLoadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{getActivityMessage(item)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
