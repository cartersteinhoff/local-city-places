"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Quote,
  Star,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { merchantNavItems } from "../nav";

interface Review {
  id: string;
  memberName: string;
  content: string;
  wordCount: number;
  createdAt: string;
  isDemo?: boolean;
  timeLabel?: string;
  submittedLabel?: string;
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

const demoReview: Review = {
  id: "demo-review",
  memberName: "Local customer preview",
  content:
    "This demo shows how a customer review will look once real feedback starts coming in. Real customer names, dates, ratings, and review text will replace this preview automatically.",
  wordCount: 30,
  createdAt: "",
  isDemo: true,
  timeLabel: "Preview",
  submittedLabel: "Demo review preview",
};

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (
      !loading &&
      (!isAuthenticated ||
        (user?.role !== "merchant" && user?.role !== "admin"))
    ) {
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

  const hasReviews = Boolean(data?.reviews.length);
  const showReviewDemo = Boolean(data && !hasReviews);
  const displayedReviews = data
    ? hasReviews
      ? data.reviews
      : [demoReview]
    : [];

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
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
            />
            <StatCard
              label="Avg. Word Count"
              value={data?.stats.avgWordCount ?? 0}
              icon={Star}
            />
            <StatCard
              label="Detailed Reviews"
              value={`${data?.stats.detailedPercent ?? 0}%`}
              icon={TrendingUp}
            />
          </div>

          {dataLoading && !data ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Loading reviews...
            </div>
          ) : !data ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Reviews could not be loaded.
            </div>
          ) : (
            <>
              {showReviewDemo && (
                <div className="mb-4 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Demo review preview
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This appears only while the merchant has no real customer
                    reviews.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {displayedReviews.map((review) => (
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
                            {review.timeLabel ||
                              formatDistanceToNow(new Date(review.createdAt), {
                                addSuffix: true,
                              })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {review.isDemo
                            ? "Demo review"
                            : `${review.wordCount} words`}
                        </span>
                      </div>
                    </div>

                    <div className="relative pl-4 border-l-2 border-primary/30">
                      <Quote className="absolute -left-3 -top-1 w-5 h-5 text-primary/40 bg-card" />
                      <p className="text-foreground leading-relaxed">
                        {review.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {review.submittedLabel ||
                          `Submitted on ${format(
                            new Date(review.createdAt),
                            "MMMM d, yyyy 'at' h:mm a",
                          )}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(data.pagination.page - 1) * data.pagination.limit + 1}-
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total,
                    )}{" "}
                    of {data.pagination.total} reviews
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
                      Page {data.pagination.page} of{" "}
                      {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1),
                        )
                      }
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
