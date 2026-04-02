"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageIcon,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

type TestimonialStatus = "submitted" | "changes_requested" | "approved" | "rejected";
type PhotoStatus = "pending" | "approved" | "rejected";

interface PhotoRecord {
  id: string;
  url: string;
  displayOrder: number;
  status: PhotoStatus;
  moderatedAt: string | null;
}

interface TestimonialDetail {
  id: string;
  memberId: string;
  merchantId: string;
  merchantName: string;
  merchantCity: string | null;
  merchantState: string | null;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string;
  content: string;
  wordCount: number;
  status: TestimonialStatus;
  moderationNotes: string | null;
  approvedAt: string | null;
  rewardStatus: string;
  rewardReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  photos: PhotoRecord[];
  photoStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

function testimonialStatusClasses(status: TestimonialStatus) {
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

export default function AdminMerchantNominationDetailPage() {
  const params = useParams<{ testimonialId: string }>();
  const testimonialId = Array.isArray(params?.testimonialId)
    ? params.testimonialId[0]
    : params?.testimonialId;

  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [testimonial, setTestimonial] = useState<TestimonialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  const loadDetail = useCallback(async () => {
    if (!testimonialId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sweepstakes/testimonials/${testimonialId}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to load merchant nomination");

      setTestimonial(json.testimonial);
      setNotes(json.testimonial.moderationNotes || "");
    } catch (detailError) {
      console.error("Failed to load merchant nomination:", detailError);
      setError(
        detailError instanceof Error
          ? detailError.message
          : "We couldn't load this merchant nomination."
      );
    } finally {
      setLoading(false);
    }
  }, [testimonialId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin" && testimonialId) {
      void loadDetail();
    }
  }, [authLoading, isAuthenticated, loadDetail, testimonialId, user?.role]);

  async function moderatePhoto(photoId: string, action: "approve" | "reject") {
    if (!testimonial) return;
    setProcessingAction(`photo:${photoId}:${action}`);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/sweepstakes/testimonials/${testimonial.id}/photos/${photoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to update photo");
      await loadDetail();
    } catch (photoError) {
      console.error("Failed to moderate nomination photo:", photoError);
      setError(photoError instanceof Error ? photoError.message : "Failed to update photo.");
    } finally {
      setProcessingAction(null);
    }
  }

  async function moderateTestimonial(action: "approve" | "reject" | "request_changes") {
    if (!testimonial) return;
    setProcessingAction(`testimonial:${action}`);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sweepstakes/testimonials/${testimonial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to update nomination");
      await loadDetail();
    } catch (moderationError) {
      console.error("Failed to moderate nomination:", moderationError);
      setError(
        moderationError instanceof Error
          ? moderationError.message
          : "Failed to update the nomination."
      );
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : testimonial ? (
        <>
          <PageHeader
            title="Merchant Nominations"
            description="Approve or reject photos first, then make the final testimonial decision."
            actions={
              <>
                <Link
                  href="/admin/sweepstakes/testimonials"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Queue
                </Link>
                <Button variant="outline" onClick={() => void loadDetail()} disabled={loading}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
              </>
            }
          />

          <div className="rounded-xl border bg-card p-5 mb-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold">{testimonial.merchantName}</h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                      testimonialStatusClasses(testimonial.status)
                    )}
                  >
                    {testimonial.status.replace("_", " ")}
                  </span>
                  {testimonial.rewardStatus === "registration_required" && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      $25 created
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {[testimonial.memberFirstName, testimonial.memberLastName]
                    .filter(Boolean)
                    .join(" ") || "Member"}{" "}
                  · {testimonial.memberEmail}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {testimonial.wordCount} words · submitted{" "}
                  {new Date(testimonial.createdAt).toLocaleDateString()} · updated{" "}
                  {new Date(testimonial.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:w-[360px]">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Photos</p>
                  <p className="text-xl font-semibold mt-1">{testimonial.photoStats.total}</p>
                </div>
                <div className="rounded-lg border bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">Pending</p>
                  <p className="text-xl font-semibold mt-1 text-blue-800">
                    {testimonial.photoStats.pending}
                  </p>
                </div>
                <div className="rounded-lg border bg-green-50 p-3">
                  <p className="text-xs text-green-700">Approved</p>
                  <p className="text-xl font-semibold mt-1 text-green-800">
                    {testimonial.photoStats.approved}
                  </p>
                </div>
                <div className="rounded-lg border bg-red-50 p-3">
                  <p className="text-xs text-red-700">Rejected</p>
                  <p className="text-xl font-semibold mt-1 text-red-800">
                    {testimonial.photoStats.rejected}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Story</h3>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7">{testimonial.content}</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Photo Review</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Decide each photo first. Final testimonial approval stays locked until every
                      photo is reviewed and at least 2 photos are approved.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {testimonial.photos.map((photo) => {
                    const approveKey = `photo:${photo.id}:approve`;
                    const rejectKey = `photo:${photo.id}:reject`;

                    return (
                      <div key={photo.id} className="rounded-xl border overflow-hidden">
                        <div className="relative">
                          <img
                            src={photo.url}
                            alt={`${testimonial.merchantName} nomination photo`}
                            className="h-64 w-full object-cover"
                          />
                          <span
                            className={cn(
                              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                              photoStatusClasses(photo.status)
                            )}
                          >
                            {photo.status}
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground">
                            Photo {photo.displayOrder + 1}
                            {photo.moderatedAt
                              ? ` · reviewed ${new Date(photo.moderatedAt).toLocaleDateString()}`
                              : " · awaiting review"}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              type="button"
                              className="flex-1"
                              variant={photo.status === "approved" ? "default" : "outline"}
                              disabled={
                                processingAction !== null || testimonial.status === "approved"
                              }
                              onClick={() => void moderatePhoto(photo.id, "approve")}
                            >
                              {processingAction === approveKey ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Approve Photo
                            </Button>
                            <Button
                              type="button"
                              className="flex-1"
                              variant="outline"
                              disabled={
                                processingAction !== null || testimonial.status === "approved"
                              }
                              onClick={() => void moderatePhoto(photo.id, "reject")}
                            >
                              {processingAction === rejectKey ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject Photo
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="text-lg font-semibold">Moderator Notes</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use this for the story-level decision. If photos were rejected, mention what the
                  member should replace or reshoot.
                </p>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-4 min-h-[180px]"
                  placeholder="Example: Great story. Please replace the blurry interior shot and the photo with text overlay."
                />
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="text-lg font-semibold">Final Testimonial Decision</h3>
                <div className="rounded-xl border bg-muted/20 p-4 mt-4 text-sm text-muted-foreground">
                  <p>Approve the nomination only after every photo is reviewed.</p>
                  <p className="mt-2">
                    This nomination currently has {testimonial.photoStats.approved} approved photo
                    {testimonial.photoStats.approved === 1 ? "" : "s"} and{" "}
                    {testimonial.photoStats.pending} pending photo
                    {testimonial.photoStats.pending === 1 ? "" : "s"}.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingAction !== null || testimonial.status === "approved"}
                    onClick={() => void moderateTestimonial("request_changes")}
                  >
                    {processingAction === "testimonial:request_changes" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 mr-2" />
                    )}
                    Request Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={processingAction !== null || testimonial.status === "approved"}
                    onClick={() => void moderateTestimonial("reject")}
                  >
                    {processingAction === "testimonial:reject" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject Testimonial
                  </Button>
                  <Button
                    type="button"
                    disabled={processingAction !== null}
                    onClick={() => void moderateTestimonial("approve")}
                  >
                    {processingAction === "testimonial:approve" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve Testimonial & Create Reward
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          We couldn&apos;t load this merchant nomination.
        </div>
      )}
    </DashboardLayout>
  );
}
