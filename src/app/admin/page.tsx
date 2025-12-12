"use client";

import { useEffect } from "react";
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

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
          value="0"
          icon={Receipt}
        />
        <StatCard
          label="Gift Cards Pending"
          value="0"
          icon={Gift}
        />
        <StatCard
          label="Active Members"
          value="0"
          icon={UserCircle}
        />
        <StatCard
          label="Active Merchants"
          value="0"
          icon={Users}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
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
        </>
      )}
    </DashboardLayout>
  );
}
