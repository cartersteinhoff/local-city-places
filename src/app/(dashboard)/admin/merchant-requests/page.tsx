"use client";

import type { LucideIcon } from "lucide-react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { adminNavItems } from "../nav";

type RequestStatus =
  | "new"
  | "in_review"
  | "waitlisted"
  | "fulfilled"
  | "invited"
  | "rejected";

type CategoryStatus = "requested" | "assigned" | "waitlisted";
type RequestFilter = RequestStatus | "all";

interface MerchantRequest {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  mobilePhone: string;
  website: string | null;
  businessAddress1: string;
  city: string;
  state: string;
  zipCode: string;
  requestedCategory: string;
  yearsInBusiness: number | null;
  shortDescription: string;
  logoUrl: string | null;
  logoFileName: string | null;
  photoUrls: string[] | null;
  photoFileNames: string[] | null;
  permissionGranted: boolean;
  status: RequestStatus;
  categoryStatus: CategoryStatus;
  adminNotes: string | null;
  merchantId: string | null;
  merchantInviteId: string | null;
  inviteSentAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  new: number;
  in_review: number;
  waitlisted: number;
  fulfilled: number;
  invited: number;
  rejected: number;
  total: number;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  },
  in_review: {
    label: "In Review",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  },
  waitlisted: {
    label: "Waitlisted",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  },
  fulfilled: {
    label: "Fulfilled",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  invited: {
    label: "Invited",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

const categoryStatusLabels: Record<CategoryStatus, string> = {
  requested: "Requested",
  assigned: "Assigned",
  waitlisted: "Waitlisted",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function StatBox({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      <div className="text-lg font-bold sm:text-2xl">{value}</div>
      <div className="text-xs text-muted-foreground sm:text-sm">{subtext}</div>
    </div>
  );
}

export default function AdminMerchantRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [requests, setRequests] = useState<MerchantRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RequestFilter>("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedRequest, setSelectedRequest] =
    useState<MerchantRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<RequestStatus>("new");
  const [draftCategoryStatus, setDraftCategoryStatus] =
    useState<CategoryStatus>("requested");
  const [draftNotes, setDraftNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [dialogError, setDialogError] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: filter,
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/merchant-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching merchant requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      fetchRequests();
    }
  }, [authLoading, isAuthenticated, user?.role, fetchRequests]);

  useEffect(() => {
    if (!selectedRequest) return;

    setDraftStatus(selectedRequest.status);
    setDraftCategoryStatus(selectedRequest.categoryStatus);
    setDraftNotes(selectedRequest.adminNotes || "");
    setInviteUrl("");
    setCopiedInvite(false);
    setDialogError("");
  }, [selectedRequest]);

  const handleFilterChange = (newFilter: RequestFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleDraftStatusChange = (value: string) => {
    const nextStatus = value as RequestStatus;
    setDraftStatus(nextStatus);

    if (nextStatus === "fulfilled" || nextStatus === "invited") {
      setDraftCategoryStatus("assigned");
    } else if (nextStatus === "waitlisted") {
      setDraftCategoryStatus("waitlisted");
    } else if (
      (nextStatus === "new" || nextStatus === "in_review") &&
      draftCategoryStatus !== "waitlisted"
    ) {
      setDraftCategoryStatus("requested");
    }
  };

  const mergeUpdatedRequest = (updatedRequest: MerchantRequest) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
      ),
    );
    setSelectedRequest(updatedRequest);
  };

  const saveRequest = async () => {
    if (!selectedRequest) return;

    setIsSaving(true);
    setDialogError("");

    try {
      const res = await fetch(
        `/api/admin/merchant-requests/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: draftStatus,
            categoryStatus: draftCategoryStatus,
            adminNotes: draftNotes,
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save request");
      }

      mergeUpdatedRequest(data.request);
      fetchRequests();
    } catch (error) {
      setDialogError(
        error instanceof Error ? error.message : "Failed to save request",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const sendInvite = async () => {
    if (!selectedRequest) return;

    setIsSendingInvite(true);
    setDialogError("");

    try {
      const res = await fetch(
        `/api/admin/merchant-requests/${selectedRequest.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sendEmail: true, expiresInDays: 7 }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteUrl(data.inviteUrl);
      mergeUpdatedRequest(data.request);
      fetchRequests();
    } catch (error) {
      setDialogError(
        error instanceof Error ? error.message : "Failed to send invite",
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;

    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Requests"
            description="Review timestamped merchant category requests and send invites after fulfillment"
          />

          <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
            <StatBox
              label="New"
              value={stats?.new ?? 0}
              subtext="Awaiting review"
              icon={Clock}
            />
            <StatBox
              label="In Review"
              value={stats?.in_review ?? 0}
              subtext="Being checked"
              icon={ClipboardList}
            />
            <StatBox
              label="Waitlisted"
              value={stats?.waitlisted ?? 0}
              subtext="Category held"
              icon={XCircle}
            />
            <StatBox
              label="Fulfilled"
              value={stats?.fulfilled ?? 0}
              subtext="Ready to invite"
              icon={ShieldCheck}
            />
            <StatBox
              label="Invited"
              value={stats?.invited ?? 0}
              subtext="Invite sent"
              icon={Mail}
            />
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search business, owner, email, city, category, or phone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-md pl-9"
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {(
              [
                "new",
                "in_review",
                "waitlisted",
                "fulfilled",
                "invited",
                "all",
              ] as RequestFilter[]
            ).map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(status)}
              >
                {status === "new" && <Clock className="mr-1 h-4 w-4" />}
                {status === "in_review" && (
                  <ClipboardList className="mr-1 h-4 w-4" />
                )}
                {status === "waitlisted" && (
                  <XCircle className="mr-1 h-4 w-4" />
                )}
                {status === "fulfilled" && (
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                )}
                {status === "invited" && <Mail className="mr-1 h-4 w-4" />}
                {status === "all"
                  ? "All"
                  : statusConfig[status as RequestStatus].label}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRequests}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y divide-border md:hidden">
              {!isLoading && requests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No merchant requests found
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {request.businessName}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {request.requestedCategory} - {request.city},{" "}
                          {request.state}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="mb-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold">
                          {formatDate(request.createdAt)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {categoryStatusLabels[request.categoryStatus]}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 text-sm text-muted-foreground">
                      <p>{request.ownerName}</p>
                      <p>
                        {request.email} -{" "}
                        {formatPhoneNumber(request.mobilePhone)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review
                    </Button>
                  </div>
                ))
              )}
            </div>

            <table className="hidden w-full table-fixed md:table">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No merchant requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="truncate font-medium">
                          {request.businessName}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {request.city}, {request.state}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="truncate text-sm">
                          {request.ownerName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {request.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="truncate">
                          {request.requestedCategory}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {categoryStatusLabels[request.categoryStatus]}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequest(request)}
                          title="Review"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={setPage}
            disabled={isLoading}
          />

          <Dialog
            open={Boolean(selectedRequest)}
            onOpenChange={(open) => !open && setSelectedRequest(null)}
          >
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              {selectedRequest && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedRequest.businessName}</DialogTitle>
                    <DialogDescription>
                      Submitted {formatDate(selectedRequest.createdAt)} for{" "}
                      {selectedRequest.requestedCategory} in{" "}
                      {selectedRequest.city}, {selectedRequest.state}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 md:grid-cols-[1fr_240px]">
                    <div className="space-y-5">
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Owner
                          </p>
                          <p className="font-medium">
                            {selectedRequest.ownerName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Contact
                          </p>
                          <p className="font-medium">{selectedRequest.email}</p>
                          <p className="text-muted-foreground">
                            {formatPhoneNumber(selectedRequest.mobilePhone)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Address
                          </p>
                          <p className="font-medium">
                            {selectedRequest.businessAddress1}
                          </p>
                          <p className="text-muted-foreground">
                            {selectedRequest.city}, {selectedRequest.state}{" "}
                            {selectedRequest.zipCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Website
                          </p>
                          {selectedRequest.website ? (
                            <a
                              href={selectedRequest.website}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {selectedRequest.website}
                            </a>
                          ) : (
                            <p className="text-muted-foreground">
                              Not provided
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Years in Business
                          </p>
                          <p className="font-medium">
                            {selectedRequest.yearsInBusiness ?? "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Permission
                          </p>
                          <p className="font-medium">
                            {selectedRequest.permissionGranted
                              ? "Granted"
                              : "Missing"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                          Description
                        </p>
                        <p className="rounded-lg bg-muted/50 p-3 text-sm leading-6">
                          {selectedRequest.shortDescription}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Logo
                          </p>
                          {selectedRequest.logoUrl ? (
                            <a
                              href={selectedRequest.logoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              View uploaded logo
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {selectedRequest.logoFileName || "No logo"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Photos
                          </p>
                          {selectedRequest.photoUrls?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedRequest.photoUrls.map((url, index) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-primary hover:underline"
                                >
                                  Photo {index + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {selectedRequest.photoFileNames?.join(", ") ||
                                "No photos"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                          Request Status
                        </p>
                        <Select
                          value={draftStatus}
                          onValueChange={handleDraftStatusChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(
                              ([status, config]) => (
                                <SelectItem key={status} value={status}>
                                  {config.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                          Category Status
                        </p>
                        <Select
                          value={draftCategoryStatus}
                          onValueChange={(value) =>
                            setDraftCategoryStatus(value as CategoryStatus)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryStatusLabels).map(
                              ([status, label]) => (
                                <SelectItem key={status} value={status}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                          Admin Notes
                        </p>
                        <Textarea
                          value={draftNotes}
                          onChange={(event) =>
                            setDraftNotes(event.target.value)
                          }
                          rows={5}
                          placeholder="Fulfillment notes, category checks, assets produced..."
                        />
                      </div>

                      {selectedRequest.inviteSentAt && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                          Invite sent {formatDate(selectedRequest.inviteSentAt)}
                        </div>
                      )}

                      {selectedRequest.merchantId && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                          <p className="font-medium">
                            Merchant dashboard created
                          </p>
                          <a
                            href={`/admin/merchants/${selectedRequest.merchantId}/edit`}
                            className="mt-1 inline-flex font-medium text-primary hover:underline"
                          >
                            Open merchant profile
                          </a>
                        </div>
                      )}

                      {inviteUrl && (
                        <div className="rounded-lg border bg-background p-3">
                          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Invite Link
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                              {inviteUrl}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={copyInviteUrl}
                            >
                              {copiedInvite ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {dialogError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {dialogError}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </Button>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={saveRequest}
                        disabled={isSaving}
                      >
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Status
                      </Button>
                      <Button
                        type="button"
                        onClick={sendInvite}
                        disabled={
                          isSendingInvite ||
                          !["fulfilled", "invited"].includes(draftStatus)
                        }
                      >
                        {isSendingInvite ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        {draftStatus === "fulfilled" ||
                        draftStatus === "invited"
                          ? "Send Invite"
                          : "Mark Fulfilled First"}
                      </Button>
                    </div>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
