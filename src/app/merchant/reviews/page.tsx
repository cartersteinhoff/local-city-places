"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Star,
  MessageSquare,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { format, formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  memberName: string;
  content: string;
  wordCount: number;
  bonusMonthAwarded: boolean;
  createdAt: string;
}

interface ReviewsData {
  stats: {
    totalReviews: number;
    avgWordCount: number;
    detailedPercent: number;
  };
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setDataLoading(true);
      fetch(`/api/merchant/reviews?page=${page}&limit=10`)
        .then((res) => res.json())
        .then((responseData) => {
          if (!responseData.error) {
            setData(responseData);
          }
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load reviews:", err);
          setDataLoading(false);
        });
    }
  }, [loading, isAuthenticated, page]);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Reviews"
            description="See what your customers are saying"
          />

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Reviews"
              value={data?.stats.totalReviews ?? 0}
              icon={MessageSquare}
              isLoading={dataLoading}
            />
            <StatCard
              label="Avg. Word Count"
              value={data?.stats.avgWordCount ?? 0}
              icon={Star}
              isLoading={dataLoading}
            />
            <StatCard
              label="Detailed Reviews"
              value={`${data?.stats.detailedPercent ?? 0}%`}
              icon={TrendingUp}
              isLoading={dataLoading}
            />
          </div>

          {/* Reviews List */}
          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data || data.reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Reviews will appear here when your GRC recipients write about their experience. Members are invited to write a review during their first GRC registration."
            />
          ) : (
            <>
              <div className="space-y-4">
                {data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {review.memberName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{review.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{review.wordCount} words</span>
                        {review.bonusMonthAwarded && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs">
                            Bonus Awarded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative pl-4 border-l-2 border-primary/30">
                      <Quote className="absolute -left-3 -top-1 w-5 h-5 text-primary/40 bg-card" />
                      <p className="text-foreground leading-relaxed">{review.content}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Submitted on {format(new Date(review.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.pagination.page - 1) * data.pagination.limit + 1}-
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{" "}
                    {data.pagination.total} reviews
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
        </>
      )}
    </DashboardLayout>
  );
}
