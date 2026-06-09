"use client";

import {
  FolderOpen,
  Loader2,
  MessageSquare,
  Send,
  Store,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "./nav";

interface DashboardStats {
  totalUsers: number;
  activeMerchants: number;
  totalReviews: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData, isAuthenticated, user?.role]);

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
            description="Manage members, merchants, reviews, and platform operations"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
          </div>

          <div className="rounded-xl border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/merchants"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Merchant Pages</p>
                  <p className="text-sm text-muted-foreground">
                    Edit public business pages
                  </p>
                </div>
              </a>
              <a
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Users</p>
                  <p className="text-sm text-muted-foreground">
                    View and edit accounts
                  </p>
                </div>
              </a>
              <a
                href="/admin/reviews"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Reviews</p>
                  <p className="text-sm text-muted-foreground">
                    Moderate public feedback
                  </p>
                </div>
              </a>
              <a
                href="/admin/emails"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Send className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email Campaigns</p>
                  <p className="text-sm text-muted-foreground">
                    Manage campaigns
                  </p>
                </div>
              </a>
              <a
                href="/admin/categories"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <FolderOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Categories</p>
                  <p className="text-sm text-muted-foreground">
                    Organize merchants
                  </p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
