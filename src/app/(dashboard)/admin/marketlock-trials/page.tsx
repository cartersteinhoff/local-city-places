"use client";

import {
  CalendarClock,
  CheckCircle2,
  Edit,
  ExternalLink,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { MarketLockStatusBadge } from "@/components/market-lock-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/hooks/use-user";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { adminNavItems } from "../nav";

interface TrialOwner {
  id: string;
  email: string;
  role: string;
  name: string | null;
}

interface TrialQueueItem {
  id: string;
  businessName: string;
  categoryName: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  requestedAt: string;
  updatedAt: string;
  createdAt: string;
  owners: TrialOwner[];
  publicUrl: string | null;
}

interface TrialQueueStats {
  total: number;
}

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

function getRequestedAge(dateStr: string) {
  const requestedAt = new Date(dateStr).getTime();
  const elapsedMs = Date.now() - requestedAt;
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86_400_000));

  if (elapsedDays === 0) return "Today";
  if (elapsedDays === 1) return "1 day ago";
  return `${elapsedDays} days ago`;
}

function getOwnerDisplay(owner: TrialOwner | undefined) {
  if (!owner) return "No owner assigned";
  return owner.name || owner.email;
}

function TrialOwners({ owners }: { owners: TrialOwner[] }) {
  const primaryOwner = owners[0];

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">
          {getOwnerDisplay(primaryOwner)}
        </span>
      </div>
      {primaryOwner?.email ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {primaryOwner.email}
        </p>
      ) : null}
      {owners.length > 1 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          +{owners.length - 1} more owner{owners.length > 2 ? "s" : ""}
        </p>
      ) : null}
    </div>
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
  icon: typeof LockKeyhole;
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

export default function AdminMarketLockTrialsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [trials, setTrials] = useState<TrialQueueItem[]>([]);
  const [stats, setStats] = useState<TrialQueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchTrials = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/marketlock-trials?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTrials(data.trials || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching MarketLOCK trial queue:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  const acceptTrial = useCallback(
    async (merchantId: string) => {
      setAcceptingId(merchantId);
      setActionError(null);

      try {
        const res = await fetch("/api/admin/marketlock-trials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantId, action: "accept" }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "Failed to accept trial request");
        }

        await fetchTrials();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Failed to accept trial request",
        );
      } finally {
        setAcceptingId(null);
      }
    },
    [fetchTrials],
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      fetchTrials();
    }
  }, [authLoading, fetchTrials, isAuthenticated, user?.role]);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="MarketLOCK Trial Requests"
            description="Merchants waiting for admin acceptance before trial access starts."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTrials}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
                />
                Refresh
              </Button>
            }
          />

          <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <StatBox
              label="Pending Requests"
              value={stats?.total ?? total}
              subtext="Awaiting acceptance"
              icon={LockKeyhole}
            />
            <StatBox
              label="Visible"
              value={trials.length}
              subtext="On this page"
              icon={Store}
            />
          </div>

          <div className="relative mb-4">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by business, city, or phone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-md pl-9"
            />
          </div>

          {actionError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {actionError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="divide-y divide-border md:hidden">
              {!isLoading && trials.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pending trial requests found.
                </div>
              ) : (
                trials.map((trial) => (
                  <div key={trial.id} className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {trial.businessName}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {trial.categoryName || "No category"}
                        </p>
                      </div>
                      <MarketLockStatusBadge status="trial_requested" />
                    </div>

                    <div className="mb-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-lg font-bold">
                          {getRequestedAge(trial.requestedAt)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(trial.requestedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 space-y-2">
                      <TrialOwners owners={trial.owners} />
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate text-muted-foreground">
                          {[trial.city, trial.state]
                            .filter(Boolean)
                            .join(", ") || "No market set"}
                        </span>
                      </div>
                      {trial.phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatPhoneNumber(trial.phone)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="col-span-2"
                        onClick={() => acceptTrial(trial.id)}
                        disabled={acceptingId === trial.id || isLoading}
                      >
                        {acceptingId === trial.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Accept request
                      </Button>
                      <Button asChild variant="outline">
                        <Link
                          href={`/admin/merchants/${trial.id}/merchant-page`}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/admin/merchants/${trial.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <table className="hidden w-full table-fixed md:table">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Market
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && trials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No pending trial requests found.
                    </td>
                  </tr>
                ) : (
                  trials.map((trial) => (
                    <tr key={trial.id} className="hover:bg-muted/35">
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {trial.businessName}
                          </p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {trial.categoryName || "No category"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <TrialOwners owners={trial.owners} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {[trial.city, trial.state]
                                .filter(Boolean)
                                .join(", ") || "No market set"}
                            </span>
                          </div>
                          {trial.phone ? (
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{formatPhoneNumber(trial.phone)}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2">
                          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {getRequestedAge(trial.requestedAt)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(trial.requestedAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <MarketLockStatusBadge status="trial_requested" />
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptTrial(trial.id)}
                            disabled={acceptingId === trial.id || isLoading}
                          >
                            {acceptingId === trial.id ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            )}
                            Accept
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/admin/merchants/${trial.id}/merchant-page`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open merchant</span>
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/merchants/${trial.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit merchant</span>
                            </Link>
                          </Button>
                        </div>
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
        </>
      )}
    </DashboardLayout>
  );
}
