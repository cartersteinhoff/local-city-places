"use client";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileAudio,
  FileText,
  Globe2,
  Loader2,
  LockKeyhole,
  type LucideIcon,
  Mailbox,
  Megaphone,
  Mic2,
  Music2,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import type {
  MerchantPageManagementData,
  MerchantPageManagementMerchant,
} from "@/components/merchant/merchant-page-management-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { getMerchantPageUrl } from "@/lib/utils";
import { merchantNavItems } from "../nav";

interface DashboardConceptData {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
  stats: {
    totalReviews: number;
    avgWordCount: number;
  };
}

type StepTone = "active" | "ready" | "waiting" | "attention";

const previewDashboardData: DashboardConceptData = {
  merchant: {
    id: "concept-preview",
    businessName: "Concept Merchant",
    categoryId: null,
    categoryName: "Mexican",
    isPublicPage: true,
    verified: true,
    city: "Denver",
    state: "CO",
    slug: null,
    logoUrl: null,
    description:
      "A sample merchant profile used only when the concept page is opened without an attached merchant account.",
    phone: "4254518599",
    website: "https://localcityplaces.com",
    photoCount: 4,
    marketLockStatus: "basic",
    updatedAt: "2026-06-08T00:00:00.000Z",
  },
  pageManagement: {
    completionPercentage: 82,
    completedFields: 9,
    totalFields: 11,
    missingSections: [
      { label: "Social links", missingFields: ["Instagram", "Facebook"] },
      { label: "Brand story", missingFields: ["About story"] },
    ],
  },
  stats: {
    totalReviews: 12,
    avgWordCount: 38,
  },
};

const toneClasses = {
  active: "border-primary/30 bg-primary/10 text-primary",
  ready: "border-success/30 bg-success/10 text-success",
  waiting: "border-muted-foreground/25 bg-muted text-muted-foreground",
  attention: "border-amber-500/30 bg-amber-500/10 text-amber-700",
} satisfies Record<StepTone, string>;

const studioAssets: Array<{
  label: string;
  detail: string;
  status: string;
  icon: LucideIcon;
  tone: StepTone;
}> = [
  {
    label: "Radio Spot",
    detail: "Final KLCP 96.5 FM ad production.",
    status: "In production",
    icon: Mic2,
    tone: "active",
  },
  {
    label: "Signature Soundtrack",
    detail: "Custom music bed for the merchant campaign.",
    status: "In production",
    icon: Music2,
    tone: "active",
  },
  {
    label: "Airplay schedule",
    detail: "Schedule unlocks after audio approval.",
    status: "Waiting",
    icon: RadioTower,
    tone: "waiting",
  },
];

const marketLockItems: Array<{
  label: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    label: "Category lock",
    detail: "Exclusive local category position.",
    icon: ShieldCheck,
  },
  {
    label: "Merchant page",
    detail: "Customer-facing Local City Places page.",
    icon: Globe2,
  },
  {
    label: "KLCP media",
    detail: "Radio spot, interview, and airplay support.",
    icon: RadioTower,
  },
  {
    label: "Direct mail",
    detail: "Local household reach for the campaign.",
    icon: Mailbox,
  },
  {
    label: "Sweepstakes",
    detail: "Traffic and referral activity tied to the market.",
    icon: Sparkles,
  },
  {
    label: "Growth upgrades",
    detail: "AI staff and Google profile support when enabled.",
    icon: Bot,
  },
];

function StatusBadge({ status, tone }: { status: string; tone: StepTone }) {
  return (
    <Badge variant="outline" className={toneClasses[tone]}>
      {status}
    </Badge>
  );
}

function SectionTitle({
  label,
  title,
  description,
  icon: Icon,
}: {
  label?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {label && (
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </p>
        )}
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0 border-t p-4 sm:border-l sm:border-t-0">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-medium">{label}</span>
      </div>
      <p className="truncate text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function DetailRow({
  label,
  detail,
  icon: Icon,
  status,
  tone = "ready",
}: {
  label: string;
  detail: string;
  icon: LucideIcon;
  status?: string;
  tone?: StepTone;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {detail}
          </p>
        </div>
      </div>
      {status && <StatusBadge status={status} tone={tone} />}
    </div>
  );
}

export default function MerchantDashboardConceptPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [dashboardData, setDashboardData] =
    useState<DashboardConceptData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isPreviewData, setIsPreviewData] = useState(false);

  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated ||
        (user?.role !== "merchant" && user?.role !== "admin"))
    ) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetch("/api/merchant/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setDashboardData(previewDashboardData);
            setIsPreviewData(true);
            return;
          }

          setDashboardData(data);
          setIsPreviewData(false);
        })
        .catch((error) => {
          console.error("Failed to load dashboard concept data:", error);
          setDashboardData(previewDashboardData);
          setIsPreviewData(true);
        })
        .finally(() => setDataLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const merchant = dashboardData?.merchant;
  const pageManagement = dashboardData?.pageManagement;
  const publicPageHref =
    merchant?.city && merchant.state && merchant.slug
      ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
      : null;
  const categoryName = merchant?.categoryName || "Category not selected";
  const marketLabel = [merchant?.city, merchant?.state]
    .filter(Boolean)
    .join(", ");
  const pageCompletion = pageManagement?.completionPercentage ?? 0;
  const missingSections = pageManagement?.missingSections ?? [];
  const missingCount = missingSections.reduce(
    (count, section) => count + section.missingFields.length,
    0,
  );
  const nextActions = [
    missingCount > 0
      ? {
          label: `Finish ${missingSections[0]?.label ?? "page gaps"}`,
          detail:
            missingSections[0]?.missingFields.join(", ") ||
            "Complete missing page details.",
          icon: AlertCircle,
          status: "Needs attention",
          tone: "attention" as StepTone,
        }
      : {
          label: "Keep page current",
          detail: "Core merchant page fields are complete.",
          icon: CheckCircle2,
          status: "Ready",
          tone: "ready" as StepTone,
        },
    {
      label: "Review studio progress",
      detail: "Radio spot and soundtrack are still in production.",
      icon: FileAudio,
      status: "In production",
      tone: "active" as StepTone,
    },
    {
      label: "Confirm MarketLock lane",
      detail: `${categoryName}${marketLabel ? ` in ${marketLabel}` : ""}`,
      icon: LockKeyhole,
      status: "Reserved",
      tone: "ready" as StepTone,
    },
  ];

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Dashboard Concept"
            description="A simpler view of page readiness, studio production, and MarketLock 360."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/merchant">
                    <FileText className="h-4 w-4" />
                    Merchant Page
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/merchant/on-air-studio">
                    <RadioTower className="h-4 w-4" />
                    On-Air Studio
                  </Link>
                </Button>
              </div>
            }
          />

          {merchant && pageManagement && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-xl border bg-card">
                <div className="grid 2xl:grid-cols-[minmax(0,1fr)_500px]">
                  <div className="p-5 md:p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                        <Sparkles className="h-3 w-3" />
                        Command center
                      </Badge>
                      {isPreviewData && (
                        <Badge variant="outline" className="px-3 py-1">
                          Concept preview
                        </Badge>
                      )}
                      <Badge variant="outline" className="px-3 py-1">
                        {merchant.isPublicPage ? "Public page" : "Private page"}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Chosen category
                    </p>
                    <div className="mt-2 flex min-w-0 items-center gap-2">
                      <Tag className="h-6 w-6 shrink-0 text-primary" />
                      <h2 className="truncate text-3xl font-bold tracking-tight md:text-5xl">
                        {categoryName}
                      </h2>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {merchant.businessName} has three active workstreams:
                      public page, On-Air Studio, and MarketLock 360.
                    </p>
                  </div>

                  <div className="grid border-t sm:grid-cols-2 2xl:border-l 2xl:border-t-0">
                    <SummaryCell
                      label="Page readiness"
                      value={`${pageCompletion}%`}
                      detail={`${pageManagement.completedFields} of ${pageManagement.totalFields} essentials`}
                      icon={CheckCircle2}
                    />
                    <SummaryCell
                      label="Studio"
                      value="In production"
                      detail="Spot and soundtrack moving"
                      icon={RadioTower}
                    />
                    <SummaryCell
                      label="MarketLock 360"
                      value="Reserved"
                      detail={marketLabel || "Market pending"}
                      icon={LockKeyhole}
                    />
                    <SummaryCell
                      label="Reviews"
                      value={dashboardData.stats.totalReviews}
                      detail={`${dashboardData.stats.avgWordCount} avg words`}
                      icon={Sparkles}
                    />
                  </div>
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="min-w-0 rounded-xl border bg-card p-5 md:p-6">
                  <SectionTitle
                    label="Start here"
                    title="Next actions"
                    description="The shortest path to understanding what needs attention."
                    icon={ArrowRight}
                  />
                  <div className="mt-5">
                    {nextActions.map((action) => (
                      <DetailRow
                        key={action.label}
                        label={action.label}
                        detail={action.detail}
                        icon={action.icon}
                        status={action.status}
                        tone={action.tone}
                      />
                    ))}
                  </div>
                </section>

                <section className="min-w-0 rounded-xl border bg-card p-5 md:p-6">
                  <SectionTitle
                    label="At a glance"
                    title="Workstreams"
                    description="Each row has one job, one status, and one destination."
                    icon={BadgeCheck}
                  />
                  <div className="mt-5 grid gap-4 2xl:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <StatusBadge
                          status={`${pageCompletion}% ready`}
                          tone={missingCount > 0 ? "attention" : "ready"}
                        />
                      </div>
                      <h3 className="font-semibold">Merchant page</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Public details, photos, category, contact info, and page
                        completion.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-4"
                      >
                        <Link href="/merchant">Open page tools</Link>
                      </Button>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <RadioTower className="h-5 w-5 text-primary" />
                        <StatusBadge status="In production" tone="active" />
                      </div>
                      <h3 className="font-semibold">On-Air Studio</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Radio spot, soundtrack, audio preview, and airplay
                        schedule.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-4"
                      >
                        <Link href="/merchant/on-air-studio">Open studio</Link>
                      </Button>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <LockKeyhole className="h-5 w-5 text-primary" />
                        <StatusBadge status="Reserved" tone="ready" />
                      </div>
                      <h3 className="font-semibold">MarketLock 360</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Category lock, local media package, direct mail, and
                        growth upgrades.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-4"
                      >
                        <Link href="#marketlock-360">View section</Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="grid gap-6 2xl:grid-cols-2">
                <section className="min-w-0 rounded-xl border bg-card p-5 md:p-6">
                  <SectionTitle
                    label="Merchant page"
                    title="Page readiness"
                    description="Only the essentials needed to understand page health."
                    icon={FileText}
                  />
                  <div className="mt-5 rounded-lg border">
                    <div className="flex items-center justify-between gap-4 border-b p-4">
                      <div>
                        <p className="text-sm font-medium">Completion</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pageManagement.completedFields} of{" "}
                          {pageManagement.totalFields} essentials complete
                        </p>
                      </div>
                      <span className="text-2xl font-bold">
                        {pageCompletion}%
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pageCompletion}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {missingSections.length ? (
                      missingSections
                        .slice(0, 4)
                        .map((section) => (
                          <DetailRow
                            key={section.label}
                            label={section.label}
                            detail={`Add ${section.missingFields.join(", ")}`}
                            icon={AlertCircle}
                            status="Missing"
                            tone="attention"
                          />
                        ))
                    ) : (
                      <DetailRow
                        label="No immediate page gaps"
                        detail="Core merchant page fields are complete."
                        icon={CheckCircle2}
                        status="Ready"
                        tone="ready"
                      />
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href="/merchant/profile">Edit details</Link>
                    </Button>
                    {publicPageHref ? (
                      <Button variant="outline" asChild>
                        <Link href={publicPageHref}>
                          <ExternalLink className="h-4 w-4" />
                          View public page
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <ExternalLink className="h-4 w-4" />
                        Public page pending
                      </Button>
                    )}
                  </div>
                </section>

                <section className="min-w-0 rounded-xl border bg-card p-5 md:p-6">
                  <SectionTitle
                    label="On-Air Studio"
                    title="Production status"
                    description="Audio and airplay details without leaving the dashboard."
                    icon={RadioTower}
                  />
                  <div className="mt-5">
                    {studioAssets.map((asset) => (
                      <DetailRow
                        key={asset.label}
                        label={asset.label}
                        detail={asset.detail}
                        icon={asset.icon}
                        status={asset.status}
                        tone={asset.tone}
                      />
                    ))}
                  </div>

                  <div className="mt-5 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Audio preview</p>
                    </div>
                    <audio
                      aria-label="Concept audio preview"
                      className="h-10 w-full min-w-0"
                      controls
                      preload="metadata"
                    >
                      <track
                        default
                        kind="captions"
                        label="Captions"
                        src="data:text/vtt,WEBVTT%0A%0A"
                      />
                    </audio>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Final campaign audio has not been uploaded yet.
                    </p>
                  </div>
                </section>
              </div>

              <section
                id="marketlock-360"
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="grid 2xl:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="border-b bg-muted/30 p-5 md:p-6 2xl:border-b-0 2xl:border-r">
                    <SectionTitle
                      label="MarketLock 360"
                      title="Local growth package"
                      description="A dedicated dashboard section for the category lock and media package."
                      icon={LockKeyhole}
                    />
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Locked category
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {categoryName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Market
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {marketLabel || "Market pending"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status="Reserved" tone="ready" />
                        <StatusBadge status="Core package" tone="active" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {marketLockItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="rounded-lg border p-4"
                          >
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold">
                              {item.label}
                            </h3>
                            <p className="mt-2 text-sm leading-5 text-muted-foreground">
                              {item.detail}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 grid gap-3 border-t pt-5 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Current
                        </p>
                        <p className="mt-1 font-semibold">MarketLock360</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Category position plus local media package.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Pro upgrade
                        </p>
                        <p className="mt-1 font-semibold">LOCAL AI Staff</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Follow-up, appointments, and communication support.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Dominator upgrade
                        </p>
                        <p className="mt-1 font-semibold">
                          Google profile support
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Maps visibility, reviews, and local search signals.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <Link href="/merchant">
                          <Search className="h-4 w-4" />
                          View MarketLock page
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/merchant/on-air-studio">
                          <Megaphone className="h-4 w-4" />
                          Review media package
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
