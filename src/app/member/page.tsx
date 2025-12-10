"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  ShoppingBag,
  UserCircle,
  DollarSign,
  Receipt,
  CheckCircle,
} from "lucide-react";

const memberNavItems = [
  { label: "Dashboard", href: "/member", icon: LayoutDashboard },
  { label: "Upload Receipt", href: "/member/upload", icon: Upload },
  { label: "Survey", href: "/member/survey", icon: ClipboardList },
  { label: "Marketplace", href: "/member/marketplace", icon: ShoppingBag },
  { label: "Profile", href: "/member/profile", icon: UserCircle },
];

export default function MemberDashboard() {
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
        // Allow members and admins
        if (data?.user?.role !== "member" && data?.user?.role !== "admin") {
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
      navItems={memberNavItems}
      userEmail={user?.email}
      userName="Member"
      userRole={user?.role as "admin" | "merchant" | "member"}
    >
      <PageHeader
        title="Member Dashboard"
        description="Track your progress and earn grocery rebates"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="This Month's Receipts"
          value="$0.00"
          icon={Receipt}
        />
        <StatCard
          label="Amount Remaining"
          value="$100.00"
          icon={DollarSign}
        />
        <StatCard
          label="Total Earned"
          value="$0.00"
          icon={DollarSign}
        />
        <StatCard
          label="Months Qualified"
          value="0"
          icon={CheckCircle}
        />
      </div>

      {/* Monthly Checklist */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Checklist</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Submit $100 in Receipts</p>
                <p className="text-sm text-muted-foreground">$0 / $100 submitted</p>
              </div>
            </div>
            <a
              href="/member/upload"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Upload Receipt
            </a>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Complete Monthly Survey</p>
                <p className="text-sm text-muted-foreground">Not completed</p>
              </div>
            </div>
            <a
              href="/member/survey"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Take Survey
            </a>
          </div>
        </div>
      </div>

      {/* Active GRC */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Active GRC</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>No active GRC</p>
          <p className="text-sm mt-1">Claim a GRC to get started</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
