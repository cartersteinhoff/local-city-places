"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Gift,
  ImagePlus,
  Loader2,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { memberNavItems } from "@/app/(dashboard)/member/nav";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  GooglePlacesAutocomplete,
  type PlaceDetails,
} from "@/components/ui/google-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

type TestimonialStatus =
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected";
type TestimonialPhotoStatus = "pending" | "approved" | "rejected";

interface TestimonialPhoto {
  id?: string;
  url: string;
  status?: TestimonialPhotoStatus;
  moderatedAt?: string | null;
}

interface MemberTestimonial {
  id: string;
  merchantId: string;
  merchantName: string;
  content: string;
  wordCount: number;
  status: TestimonialStatus;
  moderationNotes: string | null;
  rewardStatus: string;
  updatedAt: string;
  photos: TestimonialPhoto[];
}

interface PageData {
  cycle: { id: string; name: string };
  submissionLimit: number;
  confirmedEntryThisMonth: boolean;
  activeSubmissions: number;
  remainingSubmissions: number;
  currentStanding: LeaderboardEntry | null;
  leaderboardPreview: LeaderboardEntry[];
  testimonials: MemberTestimonial[];
}

interface MerchantMatch {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
}

interface LeaderboardEntry {
  memberId: string;
  displayName: string;
  regularEntries: number;
  referralEntries: number;
  totalEntries: number;
  rank: number;
}

const STEPS = ["Merchant", "Story", "Photos", "Review"];

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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

function photoStatusClasses(status: TestimonialPhotoStatus) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function FavoriteMerchantTestimonialsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const canUseMemberSweepstakes =
    user?.role === "member" || user?.role === "admin";

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const [merchantQuery, setMerchantQuery] = useState("");
  const [merchant, setMerchant] = useState<MerchantMatch | null>(null);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [merchantLoading, setMerchantLoading] = useState(false);

  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<TestimonialPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !canUseMemberSweepstakes)) {
      router.push("/");
    }
  }, [authLoading, canUseMemberSweepstakes, isAuthenticated, router]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/member/sweepstakes/testimonials");
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to load nominations");
      setData(json);
    } catch (error) {
      console.error(error);
      setFormError("We couldn't load your Favorite Merchant nominations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && canUseMemberSweepstakes) {
      void loadPage();
    }
  }, [authLoading, canUseMemberSweepstakes, isAuthenticated, loadPage]);

  function resetForm() {
    setStep(0);
    setMerchantQuery("");
    setMerchant(null);
    setMerchantError(null);
    setContent("");
    setPhotos([]);
    setEditingId(null);
    setFormError(null);
  }

  async function handleMerchantSelect(
    description: string,
    placeId: string,
    details?: PlaceDetails,
  ) {
    setMerchantQuery(details?.name || description);
    setMerchant(null);
    setMerchantError(null);
    if (!placeId) return;

    setMerchantLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("placeId", placeId);
      params.set("name", details?.name || description);
      if (details?.city) params.set("city", details.city);
      if (details?.state) params.set("state", details.state);
      const response = await fetch(
        `/api/member/sweepstakes/merchant-match?${params.toString()}`,
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to match merchant");
      if (!json.matched || !json.merchant) {
        setMerchantError(
          "Pick a merchant that already has a Local City Places page.",
        );
        return;
      }
      setMerchant(json.merchant);
    } catch (error) {
      console.error(error);
      setMerchantError("We couldn't verify that merchant yet.");
    } finally {
      setMerchantLoading(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const available = Math.max(0, 6 - photos.length);
    const nextFiles = Array.from(files).slice(0, available);
    if (!nextFiles.length) {
      setFormError("You can upload up to 6 photos.");
      return;
    }

    setUploadingPhotos(true);
    setFormError(null);

    try {
      const uploaded: TestimonialPhoto[] = [];
      for (const file of nextFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(
          "/api/member/sweepstakes/testimonials/photos",
          {
            method: "POST",
            body: formData,
          },
        );
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || `Failed to upload ${file.name}`);
        uploaded.push({ url: json.url });
      }
      setPhotos((current) => [...current, ...uploaded]);
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "Failed to upload photos.",
      );
    } finally {
      setUploadingPhotos(false);
    }
  }

  function startRevision(testimonial: MemberTestimonial) {
    setEditingId(testimonial.id);
    setMerchantQuery(testimonial.merchantName);
    setMerchant({
      id: testimonial.merchantId,
      businessName: testimonial.merchantName,
      city: null,
      state: null,
    });
    setContent(testimonial.content);
    setPhotos(
      testimonial.photos
        .filter((photo) => photo.status !== "rejected")
        .map((photo) => ({
          url: photo.url,
          id: photo.id,
          status: photo.status,
          moderatedAt: photo.moderatedAt,
        })),
    );
    setMerchantError(null);
    setFormError(null);
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    setFormError(null);
    if (step === 0 && !merchant)
      return setFormError("Choose a merchant first.");
    if (step === 1 && countWords(content) < 50)
      return setFormError("Write at least 50 words.");
    if (step === 2 && photos.length < 2)
      return setFormError("Upload at least 2 photos.");
    setStep((current) => Math.min(current + 1, 3));
  }

  async function submit() {
    if (!merchant) return setFormError("Choose a merchant first.");
    if (countWords(content) < 50)
      return setFormError("Write at least 50 words.");
    if (photos.length < 2 || photos.length > 6)
      return setFormError("Use between 2 and 6 photos.");

    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/member/sweepstakes/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testimonialId: editingId || undefined,
          merchantId: merchant.id,
          content,
          photos: photos.map((photo) => ({ id: photo.id, url: photo.url })),
        }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to submit nomination");
      setSuccessMessage(
        json.message ||
          "Your favorite merchant nomination is now pending review.",
      );
      resetForm();
      await loadPage();
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "Failed to submit nomination.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout navItems={memberNavItems}>
      {authLoading || loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Favorite Merchant Nominations"
            description="Submit a story and photos about the local business you want to spotlight."
          />

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Cycle</p>
              <p className="font-semibold mt-1">{data?.cycle.name}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="font-semibold mt-1">
                {data?.activeSubmissions} / {data?.submissionLimit}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-semibold mt-1">{data?.remainingSubmissions}</p>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-6 text-sm text-green-900">
              {successMessage}
            </div>
          )}

          {!data?.confirmedEntryThisMonth && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
              Your first favorite merchant nomination this cycle also locks in
              your sweepstakes entry.
            </div>
          )}

          <div className="space-y-4 mb-6">
            {data?.currentStanding && (
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Your leaderboard standing
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rank #{data.currentStanding.rank} this cycle
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-background border px-3 py-2 text-center">
                      <p className="text-muted-foreground">Regular</p>
                      <p className="font-semibold mt-1">
                        {data.currentStanding.regularEntries}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background border px-3 py-2 text-center">
                      <p className="text-muted-foreground">Referral</p>
                      <p className="font-semibold mt-1">
                        {data.currentStanding.referralEntries}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background border px-3 py-2 text-center">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold mt-1">
                        {data.currentStanding.totalEntries}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">Leaderboard</p>
              <p className="text-sm text-muted-foreground mt-1">
                Regular entries and activated referral entries both count toward
                your odds.
              </p>

              {data?.leaderboardPreview.length ? (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3">Rank</th>
                        <th className="text-left py-2 pr-3">Member</th>
                        <th className="text-right py-2 pr-3">Regular</th>
                        <th className="text-right py-2 pr-3">Referral</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboardPreview.map((row) => (
                        <tr
                          key={row.memberId}
                          className={cn(
                            "border-b last:border-0",
                            data.currentStanding?.memberId === row.memberId &&
                              "bg-amber-50",
                          )}
                        >
                          <td className="py-3 pr-3 font-medium">#{row.rank}</td>
                          <td className="py-3 pr-3">{row.displayName}</td>
                          <td className="py-3 pr-3 text-right">
                            {row.regularEntries}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            {row.referralEntries}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {row.totalEntries}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-background/70 p-6 mt-4 text-sm text-muted-foreground">
                  No leaderboard data yet for this cycle.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 mb-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
              {STEPS.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    index === step
                      ? "border-primary bg-primary/5"
                      : index < step
                        ? "border-green-200 bg-green-50"
                        : "border-border",
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="font-medium mt-1">{label}</p>
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="merchant-search">Merchant *</Label>
                  <GooglePlacesAutocomplete
                    value={merchantQuery}
                    onChange={handleMerchantSelect}
                    placeholder="Search for a local business"
                    types={["establishment"]}
                    fetchDetails
                  />
                </div>
                {merchantLoading && (
                  <p className="text-sm text-muted-foreground">
                    Matching merchant...
                  </p>
                )}
                {merchant && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                    <Store className="inline w-4 h-4 mr-2" />
                    {merchant.businessName}
                  </div>
                )}
                {merchantError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {merchantError}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <Label htmlFor="story">Why this merchant? *</Label>
                <Textarea
                  id="story"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-[220px]"
                  placeholder="Tell us what makes this business special."
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-muted-foreground">
                    Minimum 50 words.
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      countWords(content) >= 50
                        ? "text-green-700"
                        : "text-amber-700",
                    )}
                  >
                    {countWords(content)} words
                  </span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed p-4">
                  <Label
                    htmlFor="photo-upload"
                    className="inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {uploadingPhotos ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-2" />
                    )}
                    {uploadingPhotos ? "Uploading..." : "Add Photos"}
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void uploadFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use 2 to 6 photos. Approved photos can stay; rejected photos
                    need replacements.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[128px]">
                  {photos.map((photo, index) => (
                    <div
                      key={`${photo.url}-${index}`}
                      className="relative rounded-xl overflow-hidden border"
                    >
                      <Image
                        src={photo.url}
                        alt={`Nomination ${index + 1}`}
                        width={512}
                        height={288}
                        unoptimized
                        className="h-36 w-full object-cover"
                      />
                      {photo.status && (
                        <span
                          className={cn(
                            "absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-medium capitalize",
                            photoStatusClasses(photo.status),
                          )}
                        >
                          {photo.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((current) =>
                            current.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Merchant</p>
                  <p className="font-medium mt-1">{merchant?.businessName}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Story</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{content}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <Image
                      key={`${photo.url}-${index}`}
                      src={photo.url}
                      alt={`Review ${index + 1}`}
                      width={512}
                      height={288}
                      unoptimized
                      className="h-36 w-full rounded-xl object-cover border"
                    />
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                {formError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <div>
                {editingId && (
                  <p className="text-sm text-muted-foreground">
                    Editing a changes-requested nomination.
                  </p>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={merchantLoading}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void submit()}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  This month&apos;s nominations
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Approved nominations create a $25 certificate and publish to
                  the merchant page.
                </p>
              </div>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Start Fresh
                </Button>
              )}
            </div>

            {data?.testimonials.length ? (
              <div className="space-y-4">
                {data.testimonials.map((testimonial) => {
                  const approvedPhotos = testimonial.photos.filter(
                    (photo) => photo.status === "approved",
                  ).length;
                  const pendingPhotos = testimonial.photos.filter(
                    (photo) => photo.status === "pending",
                  ).length;
                  const rejectedPhotos = testimonial.photos.filter(
                    (photo) => photo.status === "rejected",
                  ).length;

                  return (
                    <div key={testimonial.id} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {testimonial.merchantName}
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                statusClasses(testimonial.status),
                              )}
                            >
                              {testimonial.status.replace("_", " ")}
                            </span>
                            {testimonial.rewardStatus ===
                              "registration_required" && (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                $25 ready
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Updated{" "}
                            {new Date(
                              testimonial.updatedAt,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {approvedPhotos} approved · {pendingPhotos} pending
                            · {rejectedPhotos} rejected photos
                          </p>
                          {testimonial.moderationNotes && (
                            <p className="text-sm mt-3">
                              {testimonial.moderationNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 lg:items-end">
                          {testimonial.status === "changes_requested" && (
                            <Button
                              type="button"
                              onClick={() => startRevision(testimonial)}
                            >
                              Revise
                            </Button>
                          )}
                          {testimonial.rewardStatus ===
                            "registration_required" && (
                            <a
                              href="/member/grcs"
                              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              View Certificate
                            </a>
                          )}
                        </div>
                      </div>
                      {testimonial.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {testimonial.photos
                            .slice(0, 3)
                            .map((photo, index) => (
                              <div
                                key={`${photo.url}-${index}`}
                                className="relative overflow-hidden rounded-lg border"
                              >
                                <Image
                                  src={photo.url}
                                  alt={`Nomination ${index + 1}`}
                                  width={320}
                                  height={192}
                                  unoptimized
                                  className="h-24 w-full object-cover"
                                />
                                <span
                                  className={cn(
                                    "absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-medium capitalize",
                                    photoStatusClasses(
                                      photo.status ?? "pending",
                                    ),
                                  )}
                                >
                                  {photo.status ?? "pending"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No nominations yet.
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
