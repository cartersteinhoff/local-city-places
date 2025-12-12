"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  Search,
  RefreshCw,
  Send,
  Clock,
  CheckCircle,
  DollarSign,
  Mail,
  Download,
  Loader2,
  Gift,
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

interface QualificationData {
  id: string;
  month: number;
  year: number;
  approvedTotal: string | null;
  status: string;
  rewardSentAt: string | null;
  giftCardTrackingNumber: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  grc: {
    id: string;
    denomination: number;
    groceryStore: string | null;
  };
  merchant: {
    businessName: string;
  };
}

interface Stats {
  pending: number;
  sentThisMonth: number;
  totalValue: number;
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function GiftCardsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [qualifications, setQualifications] = useState<QualificationData[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, sentThisMonth: 0, totalValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Code entry dialog
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<QualificationData | null>(null);
  const [giftCardCode, setGiftCardCode] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const fetchQualifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (monthFilter && monthFilter !== "all") params.set("month", monthFilter);
      if (yearFilter && yearFilter !== "all") params.set("year", yearFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/gift-cards?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQualifications(data.qualifications);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching qualifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchQualifications();
    }
  }, [authLoading, isAuthenticated, statusFilter, monthFilter, yearFilter, page]);

  // Debounced search
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchQualifications();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleSelectAll = () => {
    const pendingQuals = qualifications.filter((q) => !q.rewardSentAt);
    if (selectedIds.size === pendingQuals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingQuals.map((q) => q.id)));
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

  const handleMarkSent = async (qualificationId: string, trackingNumber?: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/gift-cards/${qualificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_sent", trackingNumber }),
      });
      if (res.ok) {
        await fetchQualifications();
        setSelectedIds(new Set());
        setCodeDialogOpen(false);
        setGiftCardCode("");
        setSelectedQualification(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to mark as sent");
      }
    } catch (error) {
      console.error("Error marking as sent:", error);
      alert("Failed to mark as sent");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/gift-cards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualificationIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully marked ${data.updated} gift cards as sent`);
        await fetchQualifications();
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || "Failed to bulk send");
      }
    } catch (error) {
      console.error("Error bulk sending:", error);
      alert("Failed to bulk send gift cards");
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const pendingQuals = qualifications.filter((q) => !q.rewardSentAt);
    if (pendingQuals.length === 0) {
      alert("No pending qualifications to export");
      return;
    }

    const headers = ["Name", "Email", "Month", "Year", "Merchant", "GRC Value", "Approved Total", "Reward Amount"];
    const rows = pendingQuals.map((q) => [
      `${q.member.firstName} ${q.member.lastName}`,
      q.member.email,
      months.find((m) => m.value === q.month.toString())?.label || q.month,
      q.year,
      q.merchant.businessName,
      `$${q.grc.denomination}`,
      `$${q.approvedTotal || 0}`,
      "$25",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gift-cards-pending-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMonthName = (month: number) => {
    return months.find((m) => m.value === month.toString())?.label || month;
  };

  const pendingQualifications = qualifications.filter((q) => !q.rewardSentAt);

  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Gift Card Fulfillment"
            description="Send digital rewards to qualified members"
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
              label="Sent This Month"
              value={stats.sentThisMonth}
              icon={CheckCircle}
              isLoading={isLoading}
            />
            <StatCard
              label="Pending Value"
              value={`$${stats.totalValue}`}
              icon={DollarSign}
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
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[110px]">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchQualifications} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button
                size="sm"
                onClick={handleBulkSend}
                disabled={processing}
              >
                <Send className="w-4 h-4 mr-1" />
                Send to Selected
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

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-4">
            {pendingQualifications.length > 0 && statusFilter === "pending" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === pendingQualifications.length && pendingQualifications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
            <div className="ml-auto">
              <Button variant="outline" onClick={handleExportCSV} disabled={pendingQualifications.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Qualifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-4 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : qualifications.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No gift cards found"
              description={statusFilter === "pending" ? "All caught up! No pending gift cards to fulfill." : "No gift cards match your filters."}
            />
          ) : (
            <div className="space-y-4">
              {qualifications.map((qual) => (
                <div
                  key={qual.id}
                  className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Checkbox for pending */}
                    {!qual.rewardSentAt && (
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedIds.has(qual.id)}
                          onCheckedChange={() => handleSelect(qual.id)}
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold">
                            {qual.member.firstName} {qual.member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {qual.member.email}
                          </p>
                        </div>
                        {qual.rewardSentAt ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Sent {new Date(qual.rewardSentAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-yellow-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Month: </span>
                          <span className="font-medium">{getMonthName(qual.month)} {qual.year}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">GRC: </span>
                          <span className="font-medium">{qual.merchant.businessName} ${qual.grc.denomination}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Approved: </span>
                          <span className="font-medium">${qual.approvedTotal || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reward: </span>
                          <span className="font-medium text-green-600">$25 Gift Card</span>
                        </div>
                      </div>

                      {qual.giftCardTrackingNumber && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Code: <span className="font-mono">{qual.giftCardTrackingNumber}</span>
                        </p>
                      )}

                      {/* Actions */}
                      {!qual.rewardSentAt && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkSent(qual.id)}
                            disabled={processing}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQualification(qual);
                              setCodeDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            Enter Code Manually
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

          {/* Code Entry Dialog */}
          <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Gift Card Code</DialogTitle>
                <DialogDescription>
                  Enter the gift card code for {selectedQualification?.member.firstName} {selectedQualification?.member.lastName}
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Gift Card Code</Label>
                <Input
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                  placeholder="Enter code or tracking number..."
                  className="font-mono"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedQualification && handleMarkSent(selectedQualification.id, giftCardCode)}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Mark as Sent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
