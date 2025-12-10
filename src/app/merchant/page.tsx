"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  LayoutDashboard,
  Send,
  FileText,
  ClipboardList,
  Star,
  Settings,
  Users,
  Gift,
  TrendingUp,
} from "lucide-react";

const merchantNavItems = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  { label: "Issue GRC", href: "/merchant/issue", icon: Send },
  { label: "My GRCs", href: "/merchant/grcs", icon: FileText },
  { label: "Surveys", href: "/merchant/surveys", icon: ClipboardList },
  { label: "Reviews", href: "/merchant/reviews", icon: Star },
  { label: "Settings", href: "/merchant/settings", icon: Settings },
];

export default function MerchantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        // Allow merchants and admins
        if (data?.user?.role !== "merchant" && data?.user?.role !== "admin") {
          router.push("/");
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      navItems={merchantNavItems}
      userEmail={user?.email}
      userName="Merchant"
      userRole={user?.role as "admin" | "merchant" | "member"}
    >
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
    </DashboardLayout>
  );
}
