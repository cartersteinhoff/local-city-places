"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  Search,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Filter,
  Receipt,
  Mail,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Invites", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface ReceiptData {
  id: string;
  imageUrl: string;
  amount: string | null;
  receiptDate: string | null;
  extractedStoreName: string | null;
  storeMismatch: boolean;
  dateMismatch: boolean;
  memberOverride: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  rejectionNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grc: {
    id: string;
    denomination: number;
    groceryStore: string | null;
    groceryStorePlaceId: string | null;
  };
  merchant: {
    businessName: string;
  };
}

interface Stats {
  pending: number;
  approvedThisMonth: number;
  rejected: number;
}

const rejectionReasons = [
  { value: "wrong_store", label: "Wrong Store" },
  { value: "wrong_date", label: "Wrong Date" },
  { value: "amount_too_low", label: "Amount Too Low" },
  { value: "duplicate", label: "Duplicate Receipt" },
  { value: "unreadable", label: "Unreadable" },
  { value: "other", label: "Other" },
];

export default function ModerationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedThisMonth: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [flagsOnly, setFlagsOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialogs
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingReceipt, setRejectingReceipt] = useState<ReceiptData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (flagsOnly) params.set("flagsOnly", "true");
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/receipts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchReceipts();
    }
  }, [authLoading, isAuthenticated, statusFilter, flagsOnly, page]);

  // Debounced search
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchReceipts();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleSelectAll = () => {
    if (selectedIds.size === receipts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(receipts.map((r) => r.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApprove = async (receiptId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/receipts/${receiptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        await fetchReceipts();
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve receipt");
      }
    } catch (error) {
      console.error("Error approving receipt:", error);
      alert("Failed to approve receipt");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingReceipt || !rejectionReason) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/receipts/${rejectingReceipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason,
          rejectionNotes,
        }),
      });
      if (res.ok) {
        setRejectDialogOpen(false);
        setRejectingReceipt(null);
        setRejectionReason("");
        setRejectionNotes("");
        await fetchReceipts();
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject receipt");
      }
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      alert("Failed to reject receipt");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptIds: Array.from(selectedIds),
          action: "approve",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully approved ${data.updated} receipts`);
        await fetchReceipts();
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || "Failed to bulk approve");
      }
    } catch (error) {
      console.error("Error bulk approving:", error);
      alert("Failed to bulk approve receipts");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0 || !rejectionReason) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptIds: Array.from(selectedIds),
          action: "reject",
          rejectionReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully rejected ${data.updated} receipts`);
        setBulkRejectDialogOpen(false);
        setRejectionReason("");
        await fetchReceipts();
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || "Failed to bulk reject");
      }
    } catch (error) {
      console.error("Error bulk rejecting:", error);
      alert("Failed to bulk reject receipts");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingReceipts = receipts.filter((r) => r.status === "pending");

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Receipt Moderation"
            description="Review and approve member receipt submissions"
          />

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              isLoading={isLoading}
            />
            <StatCard
              label="Approved This Month"
              value={stats.approvedThisMonth}
              icon={CheckCircle}
              isLoading={isLoading}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircle}
              isLoading={isLoading}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={flagsOnly ? "default" : "outline"}
              onClick={() => { setFlagsOnly(!flagsOnly); setPage(1); }}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Flags Only
            </Button>
            <Button variant="outline" size="icon" onClick={fetchReceipts} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBulkRejectDialogOpen(true)}
                disabled={processing}
              >
                <X className="w-4 h-4 mr-1" />
                Reject Selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Select All (only for pending) */}
          {pendingReceipts.length > 0 && statusFilter === "pending" && (
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedIds.size === pendingReceipts.length && pendingReceipts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}

          {/* Receipt List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-4 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No receipts found"
              description={statusFilter === "pending" ? "All caught up! No pending receipts to review." : "No receipts match your filters."}
            />
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Checkbox for pending */}
                    {receipt.status === "pending" && (
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedIds.has(receipt.id)}
                          onCheckedChange={() => handleSelect(receipt.id)}
                        />
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div
                      className="w-24 h-24 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                      onClick={() => {
                        setSelectedImage(receipt.imageUrl);
                        setImageDialogOpen(true);
                      }}
                    >
                      <img
                        src={receipt.imageUrl}
                        alt="Receipt"
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold">
                            {receipt.member.firstName} {receipt.member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {receipt.merchant.businessName} - ${receipt.grc.denomination} GRC
                          </p>
                        </div>
                        {getStatusBadge(receipt.status)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Store: </span>
                          <span className="font-medium">{receipt.grc.groceryStore || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium">${receipt.amount || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span className="font-medium">{formatDate(receipt.receiptDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted: </span>
                          <span className="font-medium">{formatTimeAgo(receipt.submittedAt)}</span>
                        </div>
                      </div>

                      {/* Flags */}
                      {(receipt.storeMismatch || receipt.dateMismatch || receipt.memberOverride) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {receipt.storeMismatch && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Store mismatch (OCR: {receipt.extractedStoreName || "unknown"})
                            </Badge>
                          )}
                          {receipt.dateMismatch && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Date mismatch
                            </Badge>
                          )}
                          {receipt.memberOverride && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Check className="w-3 h-3 mr-1" />
                              Member override
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Rejection info */}
                      {receipt.status === "rejected" && receipt.rejectionReason && (
                        <div className="bg-destructive/10 rounded p-2 text-sm">
                          <span className="font-medium text-destructive">
                            Rejected: {rejectionReasons.find((r) => r.value === receipt.rejectionReason)?.label || receipt.rejectionReason}
                          </span>
                          {receipt.rejectionNotes && (
                            <p className="text-muted-foreground mt-1">{receipt.rejectionNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {receipt.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage(receipt.imageUrl);
                              setImageDialogOpen(true);
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Full
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(receipt.id)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectingReceipt(receipt);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Image Dialog */}
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Receipt Image</DialogTitle>
              </DialogHeader>
              {selectedImage && (
                <div className="overflow-auto max-h-[70vh]">
                  <img
                    src={selectedImage}
                    alt="Receipt"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Single Reject Dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Receipt</DialogTitle>
                <DialogDescription>
                  Select a reason for rejecting this receipt. The member will be notified and given 7 days to reupload.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Rejection Reason</Label>
                  <Select value={rejectionReason} onValueChange={setRejectionReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {rejectionReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Additional Notes (optional)</Label>
                  <Textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Provide additional details for the member..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason || processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reject Receipt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Reject Dialog */}
          <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Reject Receipts</DialogTitle>
                <DialogDescription>
                  You are about to reject {selectedIds.size} receipts. Select a common reason for rejection.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Rejection Reason</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkReject}
                  disabled={!rejectionReason || processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reject {selectedIds.size} Receipts
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
