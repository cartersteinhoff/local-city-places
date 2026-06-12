"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileImage,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { DashboardLayout } from "@/components/layout";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
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
type VisibleRequestStatus = "new" | "fulfilled";
type RequestFilter = VisibleRequestStatus | "all";

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

const visibleRequestStatuses: VisibleRequestStatus[] = ["new", "fulfilled"];

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

function DetailItem({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-x-3 rounded-lg border bg-muted/35 px-3 py-2.5 dark:border-sky-300/15 dark:bg-[#082a43]/70 dark:shadow-[inset_0_1px_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="pt-0.5 text-muted-foreground dark:text-slate-300">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground dark:text-slate-300">
          {label}
        </p>
        <div className="mt-0.5 text-sm leading-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyValue({ children = "Not provided" }: { children?: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function getFulfillmentEmailDefaults(request: MerchantRequest) {
  return {
    email: request.email,
    subject: `You're invited to join Local City Places, ${request.businessName}`,
    message: `Hi ${request.ownerName},

Your Local City Places merchant request for ${request.businessName} has been reviewed and fulfilled. Use the registration link below to finish setting up your merchant dashboard.`,
  };
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
  const [emailDraftOpen, setEmailDraftOpen] = useState(false);
  const [fulfillmentEmail, setFulfillmentEmail] = useState("");
  const [fulfillmentSubject, setFulfillmentSubject] = useState("");
  const [fulfillmentMessage, setFulfillmentMessage] = useState("");
  const [isSendingFulfillmentEmail, setIsSendingFulfillmentEmail] =
    useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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

  const handleFilterChange = (newFilter: RequestFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const openRequest = (request: MerchantRequest) => {
    const defaults = getFulfillmentEmailDefaults(request);
    setSelectedRequest(request);
    setEmailDraftOpen(false);
    setFulfillmentEmail(defaults.email);
    setFulfillmentSubject(defaults.subject);
    setFulfillmentMessage(defaults.message);
    setActionError("");
    setActionMessage("");
  };

  const openRequestFromKeyboard = (
    event: KeyboardEvent<HTMLElement>,
    request: MerchantRequest,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRequest(request);
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

  const sendEmailAndMarkFulfilled = async () => {
    if (!selectedRequest) return;

    setActionError("");
    setActionMessage("");

    if (!emailDraftOpen) {
      setEmailDraftOpen(true);
      return;
    }

    const email = fulfillmentEmail.trim().toLowerCase();
    const subject = fulfillmentSubject.trim();
    const message = fulfillmentMessage.trim();

    if (!email || !subject || !message) {
      setActionError(
        "Email, subject, and message are required before sending.",
      );
      return;
    }

    setIsSendingFulfillmentEmail(true);

    try {
      const res = await fetch(
        `/api/admin/merchant-requests/${selectedRequest.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sendEmail: true,
            expiresInDays: 7,
            email,
            subject,
            message,
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      mergeUpdatedRequest(data.request);
      setEmailDraftOpen(false);
      setActionMessage(`Email sent to ${email} and request marked fulfilled.`);
      fetchRequests();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to send email",
      );
    } finally {
      setIsSendingFulfillmentEmail(false);
    }
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
              label="Fulfilled"
              value={stats?.fulfilled ?? 0}
              subtext="Ready to invite"
              icon={ShieldCheck}
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
            {([...visibleRequestStatuses, "all"] as RequestFilter[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(status)}
                >
                  {status === "new" && <Clock className="mr-1 h-4 w-4" />}
                  {status === "fulfilled" && (
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                  )}
                  {status === "all"
                    ? "All"
                    : statusConfig[status as RequestStatus].label}
                </Button>
              ),
            )}

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
                  <button
                    type="button"
                    key={request.id}
                    className="block w-full cursor-pointer p-4 text-left transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    onClick={() => openRequest(request)}
                  >
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
                      <div className="space-y-1">
                        <span className="text-lg font-bold">
                          {formatDate(request.createdAt)}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {formatPhoneNumber(request.mobilePhone)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 text-sm text-muted-foreground">
                      <p>{request.ownerName}</p>
                      <p>{request.email}</p>
                    </div>

                    <span
                      className={buttonVariants({
                        variant: "outline",
                        className: "w-full",
                      })}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review
                    </span>
                  </button>
                ))
              )}
            </div>

            <table className="hidden w-full table-fixed md:table">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[17%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
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
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Submitted
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
                    <tr
                      key={request.id}
                      className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      tabIndex={0}
                      onClick={() => openRequest(request)}
                      onKeyDown={(event) =>
                        openRequestFromKeyboard(event, request)
                      }
                    >
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
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatPhoneNumber(request.mobilePhone)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="truncate">
                          {request.requestedCategory}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            openRequest(request);
                          }}
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
            <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-none flex-col overflow-hidden bg-card p-0 sm:max-w-[760px] dark:border-sky-300/20 dark:bg-[#061f33] dark:text-slate-50 dark:shadow-[0_24px_80px_rgba(0,0,0,0.58)]">
              {selectedRequest && (
                <>
                  <DialogHeader className="border-b bg-muted/25 px-5 py-4 pr-12 text-left dark:border-sky-300/15 dark:bg-[#041827]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <DialogTitle className="truncate text-xl leading-tight dark:text-slate-50">
                          {selectedRequest.businessName}
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(selectedRequest.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {selectedRequest.requestedCategory}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedRequest.city}, {selectedRequest.state}
                          </span>
                        </DialogDescription>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <StatusBadge status={selectedRequest.status} />
                        <span className="inline-flex rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border dark:bg-sky-300/10 dark:text-slate-200 dark:ring-sky-300/25">
                          {categoryStatusLabels[selectedRequest.categoryStatus]}
                        </span>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="max-h-[calc(92vh-146px)] min-h-0 space-y-4 overflow-y-auto px-5 py-4 dark:bg-[#061f33]">
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold dark:text-slate-100">
                        Request details
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailItem label="Owner" icon={UserRound}>
                          <p className="font-medium">
                            {selectedRequest.ownerName}
                          </p>
                        </DetailItem>

                        <DetailItem label="Contact" icon={Mail}>
                          <a
                            href={`mailto:${selectedRequest.email}`}
                            className="block truncate font-medium text-primary hover:underline dark:text-orange-300"
                          >
                            {selectedRequest.email}
                          </a>
                          <a
                            href={`tel:${selectedRequest.mobilePhone}`}
                            className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {formatPhoneNumber(selectedRequest.mobilePhone)}
                          </a>
                        </DetailItem>

                        <DetailItem label="Location" icon={MapPin}>
                          <p className="font-medium">
                            {selectedRequest.businessAddress1}
                          </p>
                          <p className="text-muted-foreground">
                            {selectedRequest.city}, {selectedRequest.state}{" "}
                            {selectedRequest.zipCode}
                          </p>
                        </DetailItem>

                        <DetailItem label="Website" icon={Globe}>
                          {selectedRequest.website ? (
                            <a
                              href={selectedRequest.website}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate font-medium text-primary hover:underline dark:text-orange-300"
                            >
                              {selectedRequest.website}
                            </a>
                          ) : (
                            <EmptyValue />
                          )}
                        </DetailItem>

                        <DetailItem label="Category" icon={Building2}>
                          <p className="font-medium">
                            {selectedRequest.requestedCategory}
                          </p>
                          <p className="text-muted-foreground">
                            {selectedRequest.yearsInBusiness !== null
                              ? `${selectedRequest.yearsInBusiness} years in business`
                              : "Years not provided"}
                          </p>
                        </DetailItem>

                        <DetailItem label="Permission" icon={ShieldCheck}>
                          <p className="font-medium">
                            {selectedRequest.permissionGranted
                              ? "Granted"
                              : "Missing"}
                          </p>
                          <p className="text-muted-foreground">
                            Review and fulfillment permission
                          </p>
                        </DetailItem>

                        <DetailItem
                          label="Description"
                          icon={FileText}
                          className="sm:col-span-2"
                        >
                          <p>{selectedRequest.shortDescription}</p>
                        </DetailItem>

                        <DetailItem label="Logo" icon={FileImage}>
                          {selectedRequest.logoUrl ? (
                            <a
                              href={selectedRequest.logoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary hover:underline dark:text-orange-300"
                            >
                              View uploaded logo
                            </a>
                          ) : (
                            <EmptyValue>
                              {selectedRequest.logoFileName || "No logo"}
                            </EmptyValue>
                          )}
                        </DetailItem>

                        <DetailItem label="Photos" icon={FileImage}>
                          {selectedRequest.photoUrls?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedRequest.photoUrls.map((url, index) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-primary hover:bg-muted dark:border-sky-300/20 dark:bg-[#041827] dark:text-orange-300 dark:hover:bg-sky-300/10"
                                >
                                  Photo {index + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <EmptyValue>
                              {selectedRequest.photoFileNames?.join(", ") ||
                                "No photos"}
                            </EmptyValue>
                          )}
                        </DetailItem>
                      </div>
                    </section>

                    {emailDraftOpen && (
                      <section className="space-y-3 rounded-lg border bg-background p-3 dark:border-sky-300/15 dark:bg-[#082a43]/70 dark:shadow-[inset_0_1px_rgba(255,255,255,0.04)]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold dark:text-slate-100">
                            Email
                          </h3>
                          <span className="text-xs text-muted-foreground dark:text-slate-300">
                            Click the button again to send
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="fulfillmentEmail"
                              className="dark:text-slate-100"
                            >
                              To *
                            </Label>
                            <Input
                              id="fulfillmentEmail"
                              type="email"
                              value={fulfillmentEmail}
                              onChange={(event) =>
                                setFulfillmentEmail(event.target.value)
                              }
                              placeholder="owner@example.com"
                              className="dark:border-sky-300/20 dark:bg-[#041827] dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus-visible:border-sky-300/55 dark:focus-visible:ring-sky-400/25"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="fulfillmentSubject"
                              className="dark:text-slate-100"
                            >
                              Subject *
                            </Label>
                            <Input
                              id="fulfillmentSubject"
                              value={fulfillmentSubject}
                              onChange={(event) =>
                                setFulfillmentSubject(event.target.value)
                              }
                              className="dark:border-sky-300/20 dark:bg-[#041827] dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus-visible:border-sky-300/55 dark:focus-visible:ring-sky-400/25"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label
                              htmlFor="fulfillmentMessage"
                              className="dark:text-slate-100"
                            >
                              Message *
                            </Label>
                            <Textarea
                              id="fulfillmentMessage"
                              value={fulfillmentMessage}
                              onChange={(event) =>
                                setFulfillmentMessage(event.target.value)
                              }
                              rows={3}
                              className="min-h-[78px] resize-none dark:border-sky-300/20 dark:bg-[#041827] dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus-visible:border-sky-300/55 dark:focus-visible:ring-sky-400/25"
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    {actionError && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-100">
                        {actionError}
                      </div>
                    )}

                    {actionMessage && (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100">
                        {actionMessage}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="border-t bg-background px-5 py-3 dark:border-sky-300/15 dark:bg-[#041827]">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={sendEmailAndMarkFulfilled}
                      disabled={isSendingFulfillmentEmail}
                    >
                      {isSendingFulfillmentEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send email and mark as fulfilled
                    </Button>
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
