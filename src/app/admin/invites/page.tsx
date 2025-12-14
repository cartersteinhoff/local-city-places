"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  ShoppingCart,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { InviteMerchantDialog } from "@/components/admin/invite-merchant-dialog";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Trials", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface Invite {
  id: string;
  token: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  createdBy: string;
  usedByUserId: string | null;
  createdByEmail: string;
  status: "pending" | "used" | "expired";
}

interface Stats {
  pending: number;
  used: number;
  expired: number;
  total: number;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "used" | "expired">("pending");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const fetchInvites = useCallback(async () => {
    setIsLoadingInvites(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filter !== "all") {
        params.set("status", filter);
      }

      const res = await fetch(`/api/admin/merchant-invites?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setIsLoadingInvites(false);
    }
  }, [page, filter]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      fetchInvites();
    }
  }, [loading, isAuthenticated, user?.role, fetchInvites]);

  const handleDelete = async () => {
    if (!selectedInvite) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/merchant-invites/${selectedInvite.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedInvite(null);
        fetchInvites();
      }
    } catch (error) {
      console.error("Error deleting invite:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyInviteLink = async (invite: Invite) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    // Note: We can't regenerate the raw token from the hash, so we need to create a new invite
    // For now, we'll show a message that they need to create a new invite to get a copyable link
    // This is a limitation of the hash-based storage
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Since we hash tokens, we can't recover them. The link was provided when created.
    // Show a toast or message to user
    alert("Note: Invite links are only shown once when created. Please create a new invite if you need a shareable link.");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getExpiryText = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs < 0) return "Expired";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHours}h left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return "< 1h left";
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
            title="Merchant Invites"
            description="Manage merchant onboarding invitations"
            actions={
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Merchant
              </Button>
            }
          />

          {/* Stats - Compact on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Pending</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.pending ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Awaiting use</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Used</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.used ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Merchants joined</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Expired</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.expired ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Not used</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.total ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">All invites</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("pending")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
              {stats?.pending ? ` (${stats.pending})` : ""}
            </Button>
            <Button
              variant={filter === "used" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("used")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Used
            </Button>
            <Button
              variant={filter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("expired")}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Expired
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchInvites}
              disabled={isLoadingInvites}
              className="ml-auto"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingInvites && "animate-spin")} />
            </Button>
          </div>

          {/* Invites Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {!isLoadingInvites && invites.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No {filter === "all" ? "" : filter} invites found
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {invite.email || "No email specified"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created by {invite.createdByEmail}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                          invite.status === "pending" && "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                          invite.status === "used" && "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                          invite.status === "expired" && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        )}
                      >
                        {invite.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <p>Created: {formatDate(invite.createdAt)}</p>
                      {invite.status === "pending" && (
                        <p className="text-orange-600 dark:text-orange-400">{getExpiryText(invite.expiresAt)}</p>
                      )}
                      {invite.usedAt && <p>Used: {formatDate(invite.usedAt)}</p>}
                    </div>
                    {invite.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedInvite(invite);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <table className="w-full hidden md:table table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Created By
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Created
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Expires
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoadingInvites && invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No {filter === "all" ? "" : filter} invites found
                    </td>
                  </tr>
                ) : (
                  invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium truncate">
                          {invite.email || (
                            <span className="text-muted-foreground italic">No email specified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground truncate">
                        {invite.createdByEmail}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(invite.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {invite.status === "pending" ? (
                          <span className="text-orange-600 dark:text-orange-400">{getExpiryText(invite.expiresAt)}</span>
                        ) : invite.usedAt ? (
                          <span className="text-muted-foreground">
                            Used {formatDate(invite.usedAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatDate(invite.expiresAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            invite.status === "pending" && "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                            invite.status === "used" && "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                            invite.status === "expired" && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          )}
                        >
                          {invite.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invite.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedInvite(invite);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={setPage}
            disabled={isLoadingInvites}
          />

          {/* Delete Modal */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revoke Invite</DialogTitle>
                <DialogDescription>
                  Are you sure you want to revoke this invitation
                  {selectedInvite?.email ? ` for ${selectedInvite.email}` : ""}? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Revoking..." : "Revoke Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invite Merchant Dialog */}
          <InviteMerchantDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            onSuccess={fetchInvites}
          />
        </>
      )}
    </DashboardLayout>
  );
}
