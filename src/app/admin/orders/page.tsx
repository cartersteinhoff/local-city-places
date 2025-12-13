"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Eye,
  DollarSign,
  RefreshCw,
  Search,
  Mail,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Invites", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface BankInfo {
  bankName: string;
  accountHolderName: string;
  routingLast4: string;
  accountLast4: string;
  routingNumber: string;
  accountNumber: string;
  checkImageUrl: string | null;
}

interface Order {
  id: string;
  merchantId: string;
  businessName: string;
  merchantEmail: string;
  denomination: number;
  quantity: number;
  totalCost: string;
  paymentMethod: "zelle" | "business_check";
  paymentStatus: "pending" | "confirmed" | "failed";
  zelleAccountName: string | null;
  paymentNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  paymentConfirmedAt: string | null;
  bankInfo: BankInfo | null;
}

interface Stats {
  pendingCount: number;
  confirmedCount: number;
  failedCount: number;
  totalPending: number;
  totalConfirmed: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "failed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCheckImageModal, setShowCheckImageModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filter !== "all") {
        params.set("status", filter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      fetchOrders();
    }
  }, [loading, isAuthenticated, user?.role, fetchOrders]);

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: approveNotes }),
      });

      if (res.ok) {
        setShowApproveModal(false);
        setApproveNotes("");
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error approving order:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectReason) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason, notes: rejectNotes }),
      });

      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason("");
        setRejectNotes("");
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="GRC Orders"
            description="Review and approve merchant GRC purchase orders"
          />

          {/* Stats - Compact on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Pending</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.pendingCount ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">${(stats?.totalPending ?? 0).toFixed(2)}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Approved</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.confirmedCount ?? 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">${(stats?.totalConfirmed ?? 0).toFixed(2)}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Rejected</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.failedCount ?? 0}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">${((stats?.totalPending ?? 0) + (stats?.totalConfirmed ?? 0)).toFixed(2)}</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by business name, email, or bank info..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
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
              {stats?.pendingCount ? ` (${stats.pendingCount})` : ""}
            </Button>
            <Button
              variant={filter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("confirmed")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approved
            </Button>
            <Button
              variant={filter === "failed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("failed")}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rejected
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
              onClick={fetchOrders}
              disabled={isLoadingOrders}
              className="ml-auto"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingOrders && "animate-spin")} />
            </Button>
          </div>

          {/* Orders Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {!isLoadingOrders && orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {debouncedSearch
                    ? `No orders found matching "${debouncedSearch}"`
                    : `No ${filter === "all" ? "" : filter} orders found`}
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{order.businessName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{order.merchantEmail}</p>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                          order.paymentStatus === "pending" && "bg-yellow-100 text-yellow-800",
                          order.paymentStatus === "confirmed" && "bg-green-100 text-green-800",
                          order.paymentStatus === "failed" && "bg-red-100 text-red-800"
                        )}
                      >
                        {order.paymentStatus === "confirmed" ? "approved" : order.paymentStatus}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">${parseFloat(order.totalCost).toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.quantity}× ${order.denomination} GRC
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      {order.paymentMethod === "zelle" ? (
                        <>
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Zelle</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground truncate">{order.zelleAccountName || "No name"}</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium">Check</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground truncate">{order.bankInfo?.bankName || "No bank"}</span>
                          {order.bankInfo?.checkImageUrl && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCheckImageModal(true);
                              }}
                              className="ml-auto text-primary hover:text-primary/80"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{formatDate(order.createdAt)}</p>
                    {order.paymentStatus === "failed" && order.rejectionReason && (
                      <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-2 mb-3">
                        <strong>Rejected:</strong> {order.rejectionReason}
                      </div>
                    )}
                    {order.paymentStatus === "pending" && (
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => { setSelectedOrder(order); setShowApproveModal(true); }}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => { setSelectedOrder(order); setShowRejectModal(true); }}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View - Headers always visible */}
            <table className="w-full hidden md:table table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[15%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Merchant</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Payment</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoadingOrders && orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {debouncedSearch ? `No orders found matching "${debouncedSearch}"` : `No ${filter === "all" ? "" : filter} orders found`}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.businessName}</div>
                        <div className="text-sm text-muted-foreground">{order.merchantEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">${order.denomination} × {order.quantity}</td>
                      <td className="px-4 py-3 font-semibold">${parseFloat(order.totalCost).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {order.paymentMethod === "zelle" ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 font-medium"><CreditCard className="w-3 h-3" />Zelle</div>
                            <div className="text-muted-foreground">{order.zelleAccountName || "—"}</div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 font-medium"><Building2 className="w-3 h-3" />Check</div>
                            <div className="text-muted-foreground">
                              {order.bankInfo?.bankName || "—"}
                              {order.bankInfo?.checkImageUrl && (
                                <button onClick={() => { setSelectedOrder(order); setShowCheckImageModal(true); }} className="ml-2 text-primary hover:underline">
                                  <Eye className="w-3 h-3 inline" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", order.paymentStatus === "pending" && "bg-yellow-100 text-yellow-800", order.paymentStatus === "confirmed" && "bg-green-100 text-green-800", order.paymentStatus === "failed" && "bg-red-100 text-red-800")}>
                          {order.paymentStatus === "confirmed" ? "approved" : order.paymentStatus}
                        </span>
                        {order.paymentStatus === "failed" && order.rejectionReason && (
                          <div className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={order.rejectionReason}>{order.rejectionReason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {order.paymentStatus === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => { setSelectedOrder(order); setShowApproveModal(true); }}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowRejectModal(true); }}>Reject</Button>
                          </div>
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
            disabled={isLoadingOrders}
          />

          {/* Approve Modal */}
          <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Order</DialogTitle>
                <DialogDescription>
                  This will create {selectedOrder?.quantity} GRCs (${selectedOrder?.denomination} each)
                  for {selectedOrder?.businessName}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Merchant:</span>
                    </div>
                    <div className="font-medium">{selectedOrder?.businessName}</div>
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                    </div>
                    <div className="font-medium">
                      ${parseFloat(selectedOrder?.totalCost || "0").toFixed(2)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">GRCs:</span>
                    </div>
                    <div className="font-medium">
                      {selectedOrder?.quantity} x ${selectedOrder?.denomination}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="approve-notes">Notes (optional)</Label>
                  <Input
                    id="approve-notes"
                    placeholder="Any notes about the payment verification..."
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Approve & Create GRCs"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Modal */}
          <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Order</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this order from {selectedOrder?.businessName}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="reject-reason"
                    placeholder="Payment not received, Invalid bank info, etc."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reject-notes">Additional Notes (optional)</Label>
                  <Input
                    id="reject-notes"
                    placeholder="Any additional details..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason}
                >
                  {isProcessing ? "Processing..." : "Reject Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Check Image Modal */}
          <Dialog open={showCheckImageModal} onOpenChange={setShowCheckImageModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Check Image</DialogTitle>
                <DialogDescription>
                  Check from {selectedOrder?.businessName}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder?.bankInfo?.checkImageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={selectedOrder.bankInfo.checkImageUrl}
                    alt="Check"
                    className="w-full"
                  />
                </div>
              )}
              {selectedOrder?.bankInfo && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p><strong>Bank:</strong> {selectedOrder.bankInfo.bankName}</p>
                  <p><strong>Account Holder:</strong> {selectedOrder.bankInfo.accountHolderName}</p>
                  <p className="font-mono">
                    <strong>Routing:</strong> {selectedOrder.bankInfo.routingNumber}
                  </p>
                  <p className="font-mono">
                    <strong>Account:</strong> {selectedOrder.bankInfo.accountNumber}
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowCheckImageModal(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
