"use client";

import {
  FolderOpen,
  ImageIcon,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Store,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "./nav";

interface DashboardStats {
  totalUsers: number;
  activeMerchants: number;
  totalReviews: number;
  pendingNominations: number;
}

interface ActivityItem {
  id: string;
  type: string;
  merchantName?: string;
  status?: string;
  wordCount?: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

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
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, user?.role]);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000,
    );

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Admin Dashboard"
            description="Manage members, merchants, nominations, and platform operations"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Active Merchants"
              value={stats?.activeMerchants ?? 0}
              icon={Store}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Reviews"
              value={stats?.totalReviews ?? 0}
              icon={MessageSquare}
              isLoading={isLoadingStats}
            />
            <StatCard
              label="Pending Nominations"
              value={stats?.pendingNominations ?? 0}
              icon={ImageIcon}
              isLoading={isLoadingStats}
            />
          </div>

          <div className="rounded-xl border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/merchant-nominations"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <ImageIcon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Merchant Nominations</p>
                  <p className="text-sm text-muted-foreground">Review stories and photos</p>
                </div>
              </a>
              <a
                href="/admin/merchants"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Merchant Pages</p>
                  <p className="text-sm text-muted-foreground">Edit public business pages</p>
                </div>
              </a>
              <a
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Users</p>
                  <p className="text-sm text-muted-foreground">View and edit accounts</p>
                </div>
              </a>
              <a
                href="/admin/reviews"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Reviews</p>
                  <p className="text-sm text-muted-foreground">Moderate public feedback</p>
                </div>
              </a>
              <a
                href="/admin/emails"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Send className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Emails</p>
                  <p className="text-sm text-muted-foreground">Manage campaigns</p>
                </div>
              </a>
              <a
                href="/admin/categories"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <FolderOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Categories</p>
                  <p className="text-sm text-muted-foreground">Organize merchants</p>
                </div>
              </a>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Nominations</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDashboardData}
                disabled={isLoadingStats}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingStats ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            {isLoadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent nominations</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 border-b py-2 last:border-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{item.merchantName}</span>{" "}
                        nomination is {item.status?.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.wordCount} words · {formatTimeAgo(item.timestamp)}
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
