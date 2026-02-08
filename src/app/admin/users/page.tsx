"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Shield,
  Store,
  UserCircle,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  UserPlus,
  Gift,
  Users,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InviteMerchantDialog } from "@/components/admin/invite-merchant-dialog";
import { adminNavItems } from "../nav";

interface UserData {
  id: string;
  email: string;
  phone: string | null;
  role: "member" | "merchant" | "admin";
  profilePhotoUrl: string | null;
  createdAt: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberCity: string | null;
  merchantBusinessName: string | null;
  merchantCity: string | null;
  merchantVerified: boolean | null;
}

interface Stats {
  total: number;
  admins: number;
  merchants: number;
  members: number;
  pendingTrial: number;
}

interface UsersData {
  users: UserData[];
  stats: Stats;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, merchants: 0, members: 0, pendingTrial: 0 });

  // Filter state
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invite dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Add admin dialog
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState("");

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter change resets page
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Fetch data
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    });
    if (filter === "pendingTrial") {
      params.set("pendingTrial", "true");
    } else if (filter !== "all") {
      params.set("role", filter);
    }
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data: UsersData = await res.json();
      if (!data.users) return;

      setUsers(data.users);
      setStats(data.stats);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        setTotal(data.users.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchUsers();
    }
  }, [loading, isAuthenticated, fetchUsers]);

  const handleDeleteClick = (user: UserData) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchUsers();
        setDeleteDialogOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminEmail) return;
    setAddingAdmin(true);
    setAddAdminError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, role: "admin", sendInvite: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddAdminDialog(false);
        setAdminEmail("");
        await fetchUsers();
      } else {
        setAddAdminError(data.error || "Failed to add admin");
      }
    } catch {
      setAddAdminError("Failed to add admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  const getUserName = (u: UserData): string => {
    if (u.memberFirstName && u.memberLastName) {
      return `${u.memberFirstName} ${u.memberLastName}`;
    }
    if (u.merchantBusinessName) {
      return u.merchantBusinessName;
    }
    return u.email.split("@")[0];
  };

  const getInitials = (u: UserData): string => {
    if (u.memberFirstName && u.memberLastName) {
      return `${u.memberFirstName[0]}${u.memberLastName[0]}`.toUpperCase();
    }
    if (u.merchantBusinessName) {
      return u.merchantBusinessName.substring(0, 2).toUpperCase();
    }
    return u.email.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "merchant":
        return "bg-yellow-100 text-yellow-800";
      case "member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? null : (
        <>
          <PageHeader
            title="Users"
            description="View and manage all user accounts"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddAdminDialog(true)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Merchant
                </Button>
              </div>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Admins</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.admins}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Store className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Merchants</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.merchants}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <UserCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Members</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.members}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("admin")}
            >
              <Shield className="w-4 h-4 mr-1" />
              Admins
            </Button>
            <Button
              variant={filter === "merchant" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("merchant")}
            >
              <Store className="w-4 h-4 mr-1" />
              Merchants
            </Button>
            <Button
              variant={filter === "member" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("member")}
            >
              <UserCircle className="w-4 h-4 mr-1" />
              Members
            </Button>
            <Button
              variant={filter === "pendingTrial" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("pendingTrial")}
              className={cn(stats.pendingTrial > 0 && filter !== "pendingTrial" && "border-yellow-400 text-yellow-700 hover:bg-yellow-50")}
            >
              <Gift className="w-4 h-4 mr-1" />
              Pending Trial
              {stats.pendingTrial > 0 && (
                <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">
                  {stats.pendingTrial}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {!isLoading && users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No users found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || filter !== "all" ? "Try adjusting your filters" : "No users in the system yet"}
                  </p>
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="p-4">
                    {/* Header: User + Role */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={u.profilePhotoUrl || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(u)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{getUserName(u)}</h3>
                            {u.merchantVerified && (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0",
                        getRoleBadge(u.role)
                      )}>
                        {u.role}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>{u.memberCity || u.merchantCity || "No location"}</span>
                      <span>Joined {format(new Date(u.createdAt), "MMM d, yyyy")}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <table className="w-full hidden md:table table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {searchQuery || filter !== "all" ? "No users found matching your filters" : "No users in the system yet"}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={u.profilePhotoUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(u)}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">{getUserName(u)}</span>
                            {u.merchantVerified && (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground truncate block">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                          getRoleBadge(u.role)
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground truncate">
                        {u.memberCity || u.merchantCity || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(u)}
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="border-t border-border px-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={20}
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {deletingUser?.email}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Admin Dialog */}
          <Dialog open={showAddAdminDialog} onOpenChange={(open) => {
            setShowAddAdminDialog(open);
            if (!open) { setAdminEmail(""); setAddAdminError(""); }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin User</DialogTitle>
                <DialogDescription>
                  Create a new admin user. They will receive an email with a login link.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="admin-email">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && adminEmail) handleAddAdmin(); }}
                />
              </div>
              {addAdminError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                  {addAdminError}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAdmin} disabled={addingAdmin || !adminEmail}>
                  {addingAdmin ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  {addingAdmin ? "Adding..." : "Add Admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invite Merchant Dialog */}
          <InviteMerchantDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            onSuccess={fetchUsers}
          />
        </>
      )}
    </DashboardLayout>
  );
}
