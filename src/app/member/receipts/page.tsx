"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { memberNavItems } from "../nav";

interface ReceiptData {
  id: string;
  imageUrl: string;
  amount: string | null;
  receiptDate: string | null;
  extractedStoreName: string | null;
  storeMismatch: boolean;
  dateMismatch: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  rejectionNotes: string | null;
  reuploadAllowedUntil: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  grc: {
    id: string;
    denomination: number;
    groceryStore: string;
  };
  merchant: {
    businessName: string;
  };
}

interface AuthData {
  user: { email: string; role: string; profilePhotoUrl?: string | null };
  member?: { firstName: string; lastName: string };
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Fetch auth data
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
        if (data?.user?.role !== "member" && data?.user?.role !== "admin") {
          router.push("/");
          return;
        }
        setAuthData(data);
        setAuthLoading(false);
      })
      .catch(() => router.push("/"));
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      fetchReceipts();
    }
  }, [authLoading, statusFilter]);

  async function fetchReceipts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/member/receipts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch receipts");
      const data = await response.json();
      setReceipts(data.receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const statusConfig = {
    pending: {
      label: "Pending Review",
      icon: Clock,
      variant: "secondary" as const,
      color: "text-yellow-600",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle,
      variant: "default" as const,
      color: "text-green-600",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      variant: "destructive" as const,
      color: "text-red-600",
    },
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  const canReupload = (receipt: ReceiptData) => {
    if (receipt.status !== "rejected" || !receipt.reuploadAllowedUntil) return false;
    return new Date(receipt.reuploadAllowedUntil) > new Date();
  };

  // Stats
  const stats = {
    total: receipts.length,
    pending: receipts.filter((r) => r.status === "pending").length,
    approved: receipts.filter((r) => r.status === "approved").length,
    rejected: receipts.filter((r) => r.status === "rejected").length,
    totalApproved: receipts
      .filter((r) => r.status === "approved" && r.amount)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0),
  };

  const userName = authData?.member
    ? `${authData.member.firstName} ${authData.member.lastName}`
    : undefined;

  return (
    <DashboardLayout
      navItems={memberNavItems}
      userEmail={authData?.user.email}
      userName={userName}
      userRole={(authData?.user.role as "admin" | "merchant" | "member") ?? "member"}
      profilePhotoUrl={authData?.user.profilePhotoUrl}
    >
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Receipt History</h1>
          <p className="text-muted-foreground">
            View and track all your submitted receipts
          </p>
        </div>
        <Button asChild>
          <Link href="/member/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalApproved.toString())}
            </div>
            <p className="text-sm text-muted-foreground">Approved Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Receipts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchReceipts()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Receipt List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No receipts yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first receipt to start tracking your grocery purchases
            </p>
            <Button asChild>
              <Link href="/member/upload">Upload Receipt</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {receipts.map((receipt) => {
            const config = statusConfig[receipt.status];
            const StatusIcon = config.icon;

            return (
              <Card
                key={receipt.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  selectedReceipt?.id === receipt.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedReceipt(
                    selectedReceipt?.id === receipt.id ? null : receipt
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={receipt.imageUrl}
                        alt="Receipt"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold truncate">
                            {receipt.merchant.businessName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {receipt.grc.groceryStore}
                          </p>
                        </div>
                        <Badge variant={config.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span>
                          <strong>Amount:</strong> {formatCurrency(receipt.amount)}
                        </span>
                        <span>
                          <strong>Date:</strong> {formatDate(receipt.receiptDate)}
                        </span>
                        <span className="text-muted-foreground">
                          Submitted {formatDate(receipt.submittedAt)}
                        </span>
                      </div>

                      {(receipt.storeMismatch || receipt.dateMismatch) && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {receipt.storeMismatch && (
                            <div className="flex items-center gap-1 text-yellow-600 text-sm">
                              <AlertTriangle className="h-3 w-3" />
                              Store mismatch
                            </div>
                          )}
                          {receipt.dateMismatch && (
                            <div className="flex items-center gap-1 text-yellow-600 text-sm">
                              <AlertTriangle className="h-3 w-3" />
                              Date mismatch
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedReceipt?.id === receipt.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">GRC Value</p>
                          <p className="font-medium">
                            ${receipt.grc.denomination}/month
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Store (OCR)</p>
                          <p className="font-medium">
                            {receipt.extractedStoreName || "Not detected"}
                          </p>
                        </div>
                        {receipt.reviewedAt && (
                          <div>
                            <p className="text-muted-foreground">Reviewed</p>
                            <p className="font-medium">
                              {formatDate(receipt.reviewedAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {receipt.status === "rejected" && (
                        <div className="bg-destructive/10 rounded-lg p-3">
                          <p className="font-medium text-destructive">
                            Rejection Reason: {receipt.rejectionReason}
                          </p>
                          {receipt.rejectionNotes && (
                            <p className="text-sm mt-1">{receipt.rejectionNotes}</p>
                          )}
                          {canReupload(receipt) && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground mb-2">
                                You can reupload until{" "}
                                {formatDate(receipt.reuploadAllowedUntil)}
                              </p>
                              <Button size="sm" asChild>
                                <Link href="/member/upload">Reupload Receipt</Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(receipt.imageUrl, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Image
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
      )}
    </DashboardLayout>
  );
}
