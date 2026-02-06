"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Send, Search, RefreshCw, Clock, CheckCircle2, Gift, XCircle } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GrcItem {
  id: string;
  email: string | null;
  recipientName: string | null;
  denomination: number;
  status: "pending" | "active" | "completed" | "expired";
  monthsCompleted: number;
  totalMonths: number;
  groceryStore: string | null;
  issuedAt: string;
  registeredAt: string | null;
}

interface InventoryItem {
  denomination: number;
  available: number;
}

interface GrcsData {
  grcs: GrcItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    pending: number;
    active: number;
    completed: number;
    expired: number;
  };
  inventory?: {
    total: number;
    byDenomination: InventoryItem[];
  };
}

export default function MyGrcsPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  // Data state
  const [grcs, setGrcs] = useState<GrcItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0, expired: 0 });
  const [inventory, setInventory] = useState<{ total: number; byDenomination: InventoryItem[] }>({ total: 0, byDenomination: [] });

  // Filter state
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
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
  const fetchGrcs = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    });
    if (filter !== "all") params.set("status", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/merchant/grcs?${params}`);
      const data: GrcsData = await res.json();
      if (!data.grcs) return;

      setGrcs(data.grcs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      if (data.stats) setStats(data.stats);
      if (data.inventory) setInventory(data.inventory);
    } catch (err) {
      console.error("Failed to load GRCs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchGrcs();
    }
  }, [loading, isAuthenticated, fetchGrcs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (grc: GrcItem) => {
    switch (grc.status) {
      case "active":
        return `Active (${grc.monthsCompleted}/${grc.totalMonths})`;
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "expired":
        return "Expired";
      default:
        return grc.status;
    }
  };

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
        <>
          <PageHeader
            title="My GRCs"
            description="Track all your issued grocery rebate certificates"
            action={
              <a href="/merchant/issue">
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Issue GRC
                </Button>
              </a>
            }
          />

          {/* Available Inventory Banner */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-medium mb-1">Available to Issue</h3>
                <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
                  {inventory.total > 0 ? (
                    inventory.byDenomination.map((item) => (
                      <span
                        key={item.denomination}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border rounded-full text-sm"
                      >
                        <span className="font-medium">${item.denomination}</span>
                        <span className="text-muted-foreground">×{item.available}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No GRCs available
                    </span>
                  )}
                </div>
              </div>
              <a href="/merchant/purchase">
                <Button variant="outline" size="sm">
                  Purchase More
                </Button>
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Pending</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.pending}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Gift className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Active</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.active}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Completed</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.completed}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Expired</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.expired}</div>
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
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("pending")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("active")}
            >
              <Gift className="w-4 h-4 mr-1" />
              Active
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("completed")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Completed
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
              variant="ghost"
              size="sm"
              onClick={fetchGrcs}
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
              {!isLoading && grcs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No GRCs found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || filter !== "all" ? "Try adjusting your filters" : "Issue your first GRC to get started"}
                  </p>
                </div>
              ) : (
                grcs.map((grc) => (
                  <div key={grc.id} className="p-4">
                    {/* Header: Recipient + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {grc.recipientName || "—"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {grc.email || "—"}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                        getStatusBadge(grc.status)
                      )}>
                        {grc.status}
                      </span>
                    </div>

                    {/* Key metric box */}
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">${grc.denomination}</span>
                        <span className="text-sm text-muted-foreground">
                          {grc.totalMonths} months
                        </span>
                      </div>
                      {grc.status === "active" && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(grc.monthsCompleted / grc.totalMonths) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {grc.monthsCompleted}/{grc.totalMonths}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <p className="text-xs text-muted-foreground">
                      Issued {format(new Date(grc.issuedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <table className="w-full hidden md:table table-fixed">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[25%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Progress</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && grcs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {searchQuery || filter !== "all" ? "No GRCs found matching your filters" : "No GRCs issued yet"}
                    </td>
                  </tr>
                ) : (
                  grcs.map((grc) => (
                    <tr key={grc.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="truncate">
                          <p className="font-medium truncate">
                            {grc.recipientName || "—"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {grc.email || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${grc.denomination}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium",
                          getStatusBadge(grc.status)
                        )}>
                          {getStatusLabel(grc)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {grc.status === "active" && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(grc.monthsCompleted / grc.totalMonths) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {grc.monthsCompleted}/{grc.totalMonths}
                            </span>
                          </div>
                        )}
                        {grc.status === "completed" && (
                          <span className="text-sm text-muted-foreground">
                            {grc.totalMonths}/{grc.totalMonths} months
                          </span>
                        )}
                        {grc.status === "pending" && (
                          <span className="text-sm text-muted-foreground">
                            Awaiting registration
                          </span>
                        )}
                        {grc.status === "expired" && (
                          <span className="text-sm text-muted-foreground">
                            Never registered
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(grc.issuedAt), "MMM d, yyyy")}
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
        </>
      )}
    </DashboardLayout>
  );
}
