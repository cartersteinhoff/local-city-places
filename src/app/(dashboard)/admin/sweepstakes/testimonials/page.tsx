"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../nav";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";

type TestimonialStatus = "submitted" | "changes_requested" | "approved" | "rejected";

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
  photos: Array<{ id: string; url: string; displayOrder: number }>;
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

export default function AdminSweepstakesTestimonialsPage() {
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
  const [selected, setSelected] = useState<AdminTestimonial | null>(null);
  const [notes, setNotes] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);

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
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`/api/admin/sweepstakes/testimonials?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to fetch testimonials");

      setTestimonials(json.testimonials);
      setStats(json.stats);
      setTotal(json.pagination.total);
      setTotalPages(json.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch sweepstakes testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      void fetchTestimonials();
    }
  }, [authLoading, fetchTestimonials, isAuthenticated, user?.role]);

  async function moderate(action: "approve" | "request_changes" | "reject") {
    if (!selected) return;
    setProcessingAction(action);
    try {
      const response = await fetch(`/api/admin/sweepstakes/testimonials/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to update testimonial");
      setSelected(null);
      setNotes("");
      await fetchTestimonials();
    } catch (error) {
      console.error("Failed to moderate testimonial:", error);
      alert(error instanceof Error ? error.message : "Failed to update testimonial.");
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Favorite Merchant Moderation"
            description="Review nominations, publish approved stories, and create the $25 certificate path."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Submitted</p><p className="text-lg sm:text-2xl font-bold">{stats.submitted}</p></div>
            <div className="bg-card border rounded-lg p-3 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Changes Requested</p><p className="text-lg sm:text-2xl font-bold">{stats.changesRequested}</p></div>
            <div className="bg-card border rounded-lg p-3 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Approved</p><p className="text-lg sm:text-2xl font-bold">{stats.approved}</p></div>
            <div className="bg-card border rounded-lg p-3 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Rejected</p><p className="text-lg sm:text-2xl font-bold">{stats.rejected}</p></div>
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
              { key: "changes_requested", label: `Changes (${stats.changesRequested})` },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
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

            <Button variant="ghost" size="sm" onClick={() => void fetchTestimonials()} disabled={isLoading} className="ml-auto">
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>

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
                No testimonials found.
              </div>
            ) : (
              testimonials.map((testimonial) => (
                <div key={testimonial.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{testimonial.merchantName}</h3>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusClasses(testimonial.status))}>
                          {testimonial.status.replace("_", " ")}
                        </span>
                        {testimonial.rewardStatus === "registration_required" && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            $25 created
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {[testimonial.memberFirstName, testimonial.memberLastName].filter(Boolean).join(" ") || "Member"} • {testimonial.memberEmail}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {testimonial.wordCount} words • {testimonial.photoCount} photo{testimonial.photoCount === 1 ? "" : "s"} • updated {new Date(testimonial.updatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-4 line-clamp-3">{testimonial.content}</p>
                      {testimonial.moderationNotes && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Notes: {testimonial.moderationNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end lg:w-[320px] shrink-0">
                      {testimonial.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 w-full">
                          {testimonial.photos.slice(0, 3).map((photo) => (
                            <img key={photo.id} src={photo.url} alt={testimonial.merchantName} className="h-20 w-full rounded-lg object-cover border" />
                          ))}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={() => {
                          setSelected(testimonial);
                          setNotes(testimonial.moderationNotes || "");
                        }}
                      >
                        Moderate
                      </Button>
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

          <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setNotes(""); } }}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selected?.merchantName}</DialogTitle>
                <DialogDescription>
                  Review the story, photos, and moderation notes before publishing.
                </DialogDescription>
              </DialogHeader>

              {selected && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusClasses(selected.status))}>
                      {selected.status.replace("_", " ")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {[selected.memberFirstName, selected.memberLastName].filter(Boolean).join(" ") || "Member"} • {selected.memberEmail}
                    </span>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm whitespace-pre-wrap">{selected.content}</p>
                  </div>

                  {selected.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selected.photos.map((photo) => (
                        <img key={photo.id} src={photo.url} alt={selected.merchantName} className="h-32 w-full rounded-lg object-cover border" />
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Admin notes</label>
                    <Textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="mt-2 min-h-[120px]"
                      placeholder="Tell the member what to fix, or note why it was approved."
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={processingAction !== null || selected?.status === "approved"}
                  onClick={() => void moderate("request_changes")}
                >
                  {processingAction === "request_changes" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                  Request Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  disabled={processingAction !== null || selected?.status === "approved"}
                  onClick={() => void moderate("reject")}
                >
                  {processingAction === "reject" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={processingAction !== null}
                  onClick={() => void moderate("approve")}
                >
                  {processingAction === "approve" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approve & Create Reward
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
