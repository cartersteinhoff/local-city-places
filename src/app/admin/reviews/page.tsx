"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Image,
  Loader2,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";
import { cn } from "@/lib/utils";

interface ReviewData {
  id: string;
  content: string;
  rating: number | null;
  status: string;
  reviewerFirstName: string | null;
  reviewerLastName: string | null;
  reviewerPhotoUrl: string | null;
  memberId: string | null;
  merchantId: string;
  merchantName: string | null;
  createdAt: string;
  photoCount: number;
  source: "migrated" | "member";
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Filters
  const [filter, setFilter] = useState("pending");
  const [sourceFilter, setSourceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Processing
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (filter && filter !== "all") params.set("status", filter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, sourceFilter, debouncedSearch]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchReviews();
    }
  }, [authLoading, isAuthenticated, fetchReviews]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleStatusUpdate = async (reviewId: string, status: "approved" | "rejected") => {
    setProcessingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (error) {
      console.error("Error updating review:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">-</span>;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles[status] || "bg-muted")}>
        {status}
      </span>
    );
  };

  const sourceBadge = (source: string) => (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded-full font-medium",
      source === "member" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
    )}>
      {source === "member" ? "Member" : "Migrated"}
    </span>
  );

  const reviewerName = (r: ReviewData) => {
    const name = [r.reviewerFirstName, r.reviewerLastName].filter(Boolean).join(" ");
    return name || "Anonymous";
  };

  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.slice(0, maxLen) + "..." : text;

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Reviews"
            description="Moderate and manage merchant reviews"
          />

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Pending</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.pending}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Approved</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.approved}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Rejected</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.rejected}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reviewer name, content, or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          {/* Filter tabs + source + refresh */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: `Pending (${stats.pending})` },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </Button>
            ))}

            <Select value={sourceFilter || "all"} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="migrated">Migrated</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={fetchReviews} disabled={isLoading} className="ml-auto">
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Top Pagination */}
          {totalPages > 1 && (
            <div className="mb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={20}
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border border rounded-lg">
            {!isLoading && reviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No reviews found</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {review.reviewerPhotoUrl ? (
                        <img
                          src={review.reviewerPhotoUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(review.reviewerFirstName?.[0] || "?").toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{reviewerName(review)}</h3>
                        <p className="text-xs text-muted-foreground truncate">{review.merchantName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {statusBadge(review.status || "approved")}
                      {sourceBadge(review.source)}
                    </div>
                  </div>

                  <div className="mb-2">{renderStars(review.rating)}</div>

                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {review.content}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    {review.photoCount > 0 && (
                      <>
                        <Image className="w-3 h-3" />
                        <span>{review.photoCount} photo{review.photoCount !== 1 ? "s" : ""}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>

                  {review.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={processingId === review.id}
                        onClick={() => handleStatusUpdate(review.id, "approved")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={processingId === review.id}
                        onClick={() => handleStatusUpdate(review.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {review.status !== "pending" && (
                    <div className="flex gap-2">
                      {review.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === review.id}
                          onClick={() => handleStatusUpdate(review.id, "approved")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {review.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === review.id}
                          onClick={() => handleStatusUpdate(review.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Reviewer</TableHead>
                  <TableHead className="w-[8%]">Rating</TableHead>
                  <TableHead className="w-[28%]">Content</TableHead>
                  <TableHead className="w-[14%]">Merchant</TableHead>
                  <TableHead className="w-[7%] text-center">Source</TableHead>
                  <TableHead className="w-[7%] text-center">Status</TableHead>
                  <TableHead className="w-[8%]">Date</TableHead>
                  <TableHead className="w-[8%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {review.reviewerPhotoUrl ? (
                            <img
                              src={review.reviewerPhotoUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-muted-foreground">
                                {(review.reviewerFirstName?.[0] || "?").toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-sm truncate">{reviewerName(review)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.content}
                        </p>
                        {review.photoCount > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Image className="w-3 h-3" />
                            {review.photoCount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm truncate">{review.merchantName}</TableCell>
                      <TableCell className="text-center">{sourceBadge(review.source)}</TableCell>
                      <TableCell className="text-center">{statusBadge(review.status || "approved")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {review.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              disabled={processingId === review.id}
                              onClick={() => handleStatusUpdate(review.id, "approved")}
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {review.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              disabled={processingId === review.id}
                              onClick={() => handleStatusUpdate(review.id, "rejected")}
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={20}
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
