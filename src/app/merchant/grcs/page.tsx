"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { Send, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

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

interface GrcsData {
  grcs: GrcItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function MyGrcsPage() {
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
  const [data, setData] = useState<GrcsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setDataLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status,
        search,
      });

      fetch(`/api/merchant/grcs?${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setData(data);
          }
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load GRCs:", err);
          setDataLoading(false);
        });
    }
  }, [loading, isAuthenticated, page, status, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "expired":
        return "error";
      default:
        return "default";
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {!data || data.grcs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No GRCs found</p>
                <p className="text-sm mt-1">
                  {search || status !== "all" ? "Try adjusting your filters" : "Issue your first GRC to get started"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Issued</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.grcs.map((grc) => (
                        <TableRow key={grc.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {grc.recipientName || "—"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {grc.email || "Not registered"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${grc.denomination}
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={getStatusVariant(grc.status)}>
                              {getStatusLabel(grc)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(grc.issuedAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-border">
                  {data.grcs.map((grc) => (
                    <div key={grc.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {grc.recipientName || grc.email || "Not registered"}
                          </p>
                          {grc.recipientName && grc.email && (
                            <p className="text-sm text-muted-foreground">{grc.email}</p>
                          )}
                        </div>
                        <span className="font-semibold">${grc.denomination}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge variant={getStatusVariant(grc.status)} size="sm">
                          {getStatusLabel(grc)}
                        </StatusBadge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(grc.issuedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {grc.status === "active" && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
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
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(data.pagination.page - 1) * data.pagination.limit + 1}-
                      {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{" "}
                      {data.pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
