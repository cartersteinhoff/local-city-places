"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { InventoryDisplay } from "@/components/merchant/inventory-display";
import { ActivityFeed } from "@/components/merchant/activity-feed";
import {
  Send,
  ClipboardList,
  Star,
  Users,
  Gift,
  TrendingUp,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { merchantNavItems } from "./nav";
import { useUser } from "@/hooks/use-user";

interface DashboardData {
  stats: {
    activeGrcs: number;
    completedGrcs: number;
    pendingGrcs: number;
    totalGrcs: number;
    activeMembers: number;
    totalReviews: number;
  };
  inventory: {
    denomination: number;
    purchased: number;
    issued: number;
    available: number;
  }[];
  recentActivity: {
    type: "registration" | "issued" | "review" | "completed";
    memberName: string | null;
    grcValue?: number;
    wordCount?: number;
    date: string;
  }[];
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetch("/api/merchant/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setDashboardData(data);
          }
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load dashboard data:", err);
          setDataLoading(false);
        });
    }
  }, [loading, isAuthenticated]);

  const hasNoGrcs = !dataLoading && dashboardData && dashboardData.stats.totalGrcs === 0;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading || dataLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : hasNoGrcs ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Get Started with GRCs</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Purchase GRCs to start rewarding your customers and growing your business with Local City Places.
          </p>
          <a
            href="/merchant/purchase"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Purchase GRCs
          </a>
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Dashboard"
            description="Manage your GRCs and track customer engagement"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Active GRCs"
              value={dashboardData?.stats.activeGrcs ?? 0}
              icon={Gift}
              isLoading={dataLoading}
            />
            <StatCard
              label="Completed"
              value={dashboardData?.stats.completedGrcs ?? 0}
              icon={TrendingUp}
              isLoading={dataLoading}
            />
            <StatCard
              label="Active Members"
              value={dashboardData?.stats.activeMembers ?? 0}
              icon={Users}
              isLoading={dataLoading}
            />
            <StatCard
              label="Reviews"
              value={dashboardData?.stats.totalReviews ?? 0}
              icon={Star}
              isLoading={dataLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a
                    href="/merchant/issue"
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Issue GRCs</p>
                      <p className="text-xs text-muted-foreground">Send to customers</p>
                    </div>
                  </a>
                  <a
                    href="/merchant/surveys"
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Surveys</p>
                      <p className="text-xs text-muted-foreground">Manage questions</p>
                    </div>
                  </a>
                  <a
                    href="/merchant/reviews"
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Reviews</p>
                      <p className="text-xs text-muted-foreground">View feedback</p>
                    </div>
                  </a>
                </div>

                {/* Secondary Actions */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="/merchant/grcs"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>View All GRCs</span>
                      {dashboardData && (
                        <span className="ml-auto text-muted-foreground">
                          {dashboardData.stats.totalGrcs}
                        </span>
                      )}
                    </a>
                    <a
                      href="/merchant/profile"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Business Profile</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="lg:col-span-1">
              <InventoryDisplay
                inventory={dashboardData?.inventory ?? []}
                isLoading={dataLoading}
              />
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={dashboardData?.recentActivity ?? []}
            isLoading={dataLoading}
          />
        </>
      )}
    </DashboardLayout>
  );
}
