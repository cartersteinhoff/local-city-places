"use client";

import {
  ArrowRight,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { adminNavItems } from "../../nav";

type TestimonialStatus =
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected";
type PhotoStatus = "pending" | "approved" | "rejected";

interface AdminTestimonial {
  id: string;
  merchantId: string;
  merchantName: string;
  memberId: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string;
  content: string;
  wordCount: number;
  status: TestimonialStatus;
  moderationNotes: string | null;
  rewardStatus: string;
  rewardReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
  pendingPhotoCount: number;
  approvedPhotoCount: number;
  rejectedPhotoCount: number;
  photos: Array<{
    id: string;
    url: string;
    displayOrder: number;
    status: PhotoStatus;
  }>;
}

interface Stats {
  total: number;
  submitted: number;
  changesRequested: number;
  approved: number;
  rejected: number;
}

function statusClasses(status: TestimonialStatus) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "changes_requested":
      return "bg-amber-100 text-amber-800";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function photoStatusClasses(status: PhotoStatus) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function readinessLabel(testimonial: AdminTestimonial) {
  if (testimonial.status === "approved") {
    return "Published";
  }

  if (testimonial.pendingPhotoCount > 0) {
    return "Photo review pending";
  }

  if (testimonial.approvedPhotoCount >= 2) {
    return "Ready for final approval";
  }

  return "Need 2 approved photos";
}

export default function AdminMerchantNominationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    submitted: 0,
    changesRequested: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(
        `/api/admin/sweepstakes/testimonials?${params.toString()}`,
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to fetch merchant nominations");

      setTestimonials(json.testimonials);
      setStats(json.stats);
      setTotal(json.pagination.total);
      setTotalPages(json.pagination.totalPages);
    } catch (fetchError) {
      console.error("Failed to fetch merchant nominations:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "We couldn't load the merchant nominations queue.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      void fetchTestimonials();
    }
  }, [authLoading, fetchTestimonials, isAuthenticated, user?.role]);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Nominations"
            description="Open the queue, review each photo one by one, and then make the final testimonial decision."
            actions={
              <>
                <Link
                  href="/admin/sweepstakes"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Sweepstakes Control Room
                </Link>
                <Button
                  variant="outline"
                  onClick={() => void fetchTestimonials()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
                  />
                  Refresh
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Submitted
              </p>
              <p className="text-lg sm:text-2xl font-bold">{stats.submitted}</p>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Changes Requested
              </p>
              <p className="text-lg sm:text-2xl font-bold">
                {stats.changesRequested}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Approved
              </p>
              <p className="text-lg sm:text-2xl font-bold">{stats.approved}</p>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Rejected
              </p>
              <p className="text-lg sm:text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by member, merchant, email, or story..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: "all", label: `All (${stats.total})` },
              { key: "submitted", label: `Submitted (${stats.submitted})` },
              {
                key: "changes_requested",
                label: `Changes (${stats.changesRequested})`,
              },
              { key: "approved", label: `Approved (${stats.approved})` },
              { key: "rejected", label: `Rejected (${stats.rejected})` },
            ].map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={statusFilter === filter.key ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(filter.key);
                  setPage(1);
                }}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6">
              {error}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={12}
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-4">
            {!isLoading && testimonials.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                No merchant nominations found.
              </div>
            ) : (
              testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-xl border bg-card p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {testimonial.merchantName}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            statusClasses(testimonial.status),
                          )}
                        >
                          {testimonial.status.replace("_", " ")}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {readinessLabel(testimonial)}
                        </span>
                        {testimonial.rewardStatus ===
                          "registration_required" && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            $25 created
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        {[
                          testimonial.memberFirstName,
                          testimonial.memberLastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Member"}{" "}
                        | {testimonial.memberEmail}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {testimonial.wordCount} words | updated{" "}
                        {new Date(testimonial.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {testimonial.photoCount} photos
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                          {testimonial.pendingPhotoCount} pending
                        </span>
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                          {testimonial.approvedPhotoCount} approved
                        </span>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                          {testimonial.rejectedPhotoCount} rejected
                        </span>
                      </div>
                      <p className="text-sm mt-4 line-clamp-3">
                        {testimonial.content}
                      </p>
                      {testimonial.moderationNotes && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Notes: {testimonial.moderationNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 xl:w-[320px] shrink-0">
                      {testimonial.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 min-h-[80px]">
                          {testimonial.photos.slice(0, 3).map((photo) => (
                            <div
                              key={photo.id}
                              className="relative overflow-hidden rounded-lg border"
                            >
                              <Image
                                src={photo.url}
                                alt={testimonial.merchantName}
                                width={320}
                                height={160}
                                unoptimized
                                className="h-20 w-full object-cover"
                              />
                              <span
                                className={cn(
                                  "absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-medium capitalize",
                                  photoStatusClasses(photo.status),
                                )}
                              >
                                {photo.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/admin/sweepstakes/testimonials/${testimonial.id}`}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Manage Nomination
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={12}
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
