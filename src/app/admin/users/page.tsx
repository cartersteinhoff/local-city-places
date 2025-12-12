"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Search,
  RefreshCw,
  Shield,
  Store,
  UserCircle,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  Receipt,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

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
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, merchants: 0, members: 0 });
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchUsers();
    }
  }, [loading, roleFilter]);

  // Debounced search
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

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

  const getUserName = (user: UserData): string => {
    if (user.memberFirstName && user.memberLastName) {
      return `${user.memberFirstName} ${user.memberLastName}`;
    }
    if (user.merchantBusinessName) {
      return user.merchantBusinessName;
    }
    return user.email.split("@")[0];
  };

  const getInitials = (user: UserData): string => {
    if (user.memberFirstName && user.memberLastName) {
      return `${user.memberFirstName[0]}${user.memberLastName[0]}`.toUpperCase();
    }
    if (user.merchantBusinessName) {
      return user.merchantBusinessName.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <StatusBadge status="info" label="Admin" />;
      case "merchant":
        return <StatusBadge status="warning" label="Merchant" />;
      case "member":
        return <StatusBadge status="success" label="Member" />;
      default:
        return <StatusBadge status="default" label={role} />;
    }
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Users"
            description="View and manage all user accounts"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={stats.total.toString()} icon={Users} />
            <StatCard label="Admins" value={stats.admins.toString()} icon={Shield} />
            <StatCard label="Merchants" value={stats.merchants.toString()} icon={Store} />
            <StatCard label="Members" value={stats.members.toString()} icon={UserCircle} />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchUsers} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Users Table */}
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={searchQuery || roleFilter !== "all" ? "Try adjusting your filters" : "No users in the system yet"}
            />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="h-14">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePhotoUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{getUserName(user)}</span>
                            {user.merchantVerified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.memberCity || user.merchantCity || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(user)}
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
        </>
      )}
    </DashboardLayout>
  );
}
