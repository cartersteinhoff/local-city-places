"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Send,
  ClipboardList,
  Star,
  Users,
  Gift,
  TrendingUp,
} from "lucide-react";
import { merchantNavItems } from "./nav";
import { useUser } from "@/hooks/use-user";

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  return (
    <DashboardLayout
      navItems={merchantNavItems}
      userEmail={user?.email}
      userName={userName}
      userRole={user?.role ?? "merchant"}
      profilePhotoUrl={user?.profilePhotoUrl}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
        <PageHeader
        title="Merchant Dashboard"
        description="Manage your GRCs and track customer engagement"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active GRCs"
          value="0"
          icon={Gift}
        />
        <StatCard
          label="GRCs Redeemed"
          value="0"
          icon={TrendingUp}
        />
        <StatCard
          label="Active Members"
          value="0"
          icon={Users}
        />
        <StatCard
          label="Avg. Review Score"
          value="N/A"
          icon={Star}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/merchant/issue"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Send className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Issue New GRCs</p>
              <p className="text-sm text-muted-foreground">Purchase and distribute certificates</p>
            </div>
          </a>
          <a
            href="/merchant/surveys"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ClipboardList className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Manage Surveys</p>
              <p className="text-sm text-muted-foreground">Create and edit customer surveys</p>
            </div>
          </a>
          <a
            href="/merchant/reviews"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Star className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">View Reviews</p>
              <p className="text-sm text-muted-foreground">See customer feedback</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity</p>
          <p className="text-sm mt-1">Issue GRCs to get started</p>
        </div>
      </div>
        </>
      )}
    </DashboardLayout>
  );
}
