"use client";

import {
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileAudio,
  Globe2,
  Loader2,
  LockKeyhole,
  Mailbox,
  Pause,
  Play,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  type MerchantPageManagementData,
  type MerchantPageManagementMerchant,
  MerchantPageManagementPanel,
} from "@/components/merchant/merchant-page-management-panel";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { getMerchantPageUrl } from "@/lib/utils";
import { merchantNavItems } from "./nav";

interface DashboardData {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
  campaignTrack?: CampaignTrackData;
}

interface CampaignTrackData {
  title: string;
  description: string;
  audioSrc: string | null;
  status: "ready" | "in_production" | "pending";
  updatedAt: string | null;
}

const marketLockCoreTools = [
  {
    label: "Radio campaign",
    detail: "KLCP spot, interview, and airplay support for the market.",
    icon: RadioTower,
  },
  {
    label: "Direct mail reach",
    detail: "Household reach tied to the same city and category position.",
    icon: Mailbox,
  },
  {
    label: "Sweepstakes traffic",
    detail: "Member nominations, referrals, and campaign engagement.",
    icon: Sparkles,
  },
  {
    label: "Local growth support",
    detail:
      "Merchant page visibility, campaign coordination, and local signals.",
    icon: Globe2,
  },
];

const marketLockAddOns = [
  {
    label: "LOCAL AI Staff",
    detail: "Follow-up, appointments, and customer communication support.",
    icon: Bot,
  },
  {
    label: "Google profile support",
    detail: "Maps visibility, reviews, and local search signals.",
    icon: Globe2,
  },
];

const emptyCaptionsTrack = "data:text/vtt,WEBVTT%0A%0A";

const waveformBars = [
  { id: "intro", height: 32 },
  { id: "lift", height: 56 },
  { id: "pulse", height: 44 },
  { id: "hook", height: 72 },
  { id: "drop", height: 38 },
  { id: "rise", height: 62 },
  { id: "peak", height: 84 },
  { id: "break", height: 48 },
  { id: "bridge", height: 70 },
  { id: "turn", height: 52 },
  { id: "bed", height: 36 },
  { id: "tag", height: 60 },
  { id: "outro", height: 78 },
  { id: "end", height: 46 },
];

function formatTrackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function MerchantActivationBanner({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const categoryName = merchant?.categoryName || "Local category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "Your market";
  const cityCategoryLock = `${categoryName} in ${marketLabel}`;
  const proofItems = [
    {
      label: "Category",
      value: categoryName,
      detail: "Reserved for this market",
      icon: ShieldCheck,
    },
    {
      label: "City",
      value: marketLabel,
      detail: "Protected campaign area",
      icon: LockKeyhole,
    },
    {
      label: "Status",
      value: "Reserved",
      detail: "Ready for MarketLock360",
      icon: CheckCircle2,
    },
    {
      label: "Page",
      value: merchant?.isPublicPage ? "Active" : "Private",
      detail: "Merchant profile surface",
      icon: Globe2,
    },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-xl border bg-card">
      <div className="grid xl:grid-cols-[minmax(0,0.9fr)_minmax(480px,1.1fr)]">
        <div className="border-b bg-muted/25 p-5 md:p-6 xl:border-b-0 xl:border-r">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Reserved position
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {cityCategoryLock}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your city and category position is ready. MarketLock360 is the next
            step that turns it into a local campaign.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {proofItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-lg border bg-background/80 p-4"
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden p-5 md:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">
                MarketLock360 activation
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Activate MarketLock360
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Turn your {categoryName} category position in {marketLabel} into
                radio, direct mail, sweepstakes traffic, and local growth
                support.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Next step
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {marketLockCoreTools.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex gap-3 rounded-lg border bg-primary/5 p-4"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <a
            href="/marketlock360"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Activate MarketLock360
          </a>
        </div>
      </div>
    </section>
  );
}

function CampaignTrackPanel({
  track,
  merchantName,
}: {
  track: CampaignTrackData | undefined;
  merchantName: string | undefined;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasTrack = !!track?.audioSrc;
  const title =
    track?.title || `${merchantName || "Your merchant"} campaign soundtrack`;
  const description =
    track?.description ||
    "A custom audio asset produced for your local media campaign.";
  const updatedLabel = track?.updatedAt
    ? new Date(track.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const progressMax = duration || 1;
  const progressValue = duration ? currentTime : 0;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !hasTrack) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: string) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-xl border bg-card">
      <div className="grid gap-0 2xl:grid-cols-[minmax(0,0.7fr)_minmax(360px,1.3fr)]">
        <div className="border-b bg-muted/30 p-5 md:p-6 2xl:border-b-0 2xl:border-r">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileAudio className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Campaign audio
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                hasTrack
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              }`}
            >
              {hasTrack ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {hasTrack ? "Ready to play" : "In production"}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
              {updatedLabel ? `Updated ${updatedLabel}` : "Preview pending"}
            </span>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex h-full flex-col justify-center">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold">
                  {hasTrack
                    ? "Listen to your track"
                    : "Audio preview coming soon"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasTrack
                    ? "Play the approved campaign audio without leaving the dashboard."
                    : "Once production is approved, your finished track will be playable here."}
                </p>
              </div>
              {hasTrack ? (
                <a
                  href={track.audioSrc || undefined}
                  download
                  className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              ) : (
                <span className="inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium text-muted-foreground">
                  <Download className="mr-2 h-4 w-4" />
                  Download pending
                </span>
              )}
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={!hasTrack}
                  onClick={togglePlayback}
                  aria-label={
                    isPlaying ? "Pause campaign track" : "Play campaign track"
                  }
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-primary transition-colors ${
                    hasTrack
                      ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
                      : "cursor-not-allowed border-muted bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                    <span>{formatTrackTime(currentTime)}</span>
                    <span>{formatTrackTime(duration)}</span>
                  </div>
                  <input
                    aria-label="Campaign track progress"
                    className="h-2 w-full accent-primary"
                    disabled={!hasTrack}
                    max={progressMax}
                    min={0}
                    onChange={(event) => handleSeek(event.target.value)}
                    step="0.1"
                    type="range"
                    value={progressValue}
                  />
                </div>

                <Volume2 className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
              </div>

              <div
                aria-hidden="true"
                className={`mt-4 grid h-10 grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1 ${
                  hasTrack ? "opacity-100" : "opacity-45"
                }`}
              >
                {waveformBars.map((bar) => (
                  <span
                    key={bar.id}
                    className="rounded-full bg-primary/55"
                    style={{ height: `${bar.height}%` }}
                  />
                ))}
              </div>
            </div>

            <audio
              ref={audioRef}
              aria-label={`${title} player`}
              className="sr-only"
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(event) => {
                setDuration(event.currentTarget.duration || 0);
              }}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={(event) => {
                setCurrentTime(event.currentTarget.currentTime || 0);
              }}
              preload="metadata"
              src={track?.audioSrc || undefined}
            >
              <track
                default
                kind="captions"
                label="Captions"
                src={emptyCaptionsTrack}
              />
            </audio>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {hasTrack
                ? "This is the current approved audio connected to the merchant campaign."
                : "Your audio file will be added here after final production is complete."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketLockDashboardCard({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const categoryName = merchant?.categoryName || "Mexican";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "Chandler, AZ";
  const cityCategoryLock = `${categoryName} in ${marketLabel}`;

  return (
    <section
      id="marketlock-360"
      className="mb-6 w-full overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex flex-col gap-4 p-5 md:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Optional add-ons
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Build beyond MarketLock360
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            After activating MarketLock360 for {cityCategoryLock}, add extra
            support for follow-up, appointments, search visibility, and reviews.
          </p>
        </div>
        <a
          href="/marketlock360"
          className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Activate MarketLock360 first
        </a>
      </div>

      <div className="grid gap-3 border-t bg-muted/25 p-5 md:grid-cols-2 md:p-6">
        {marketLockAddOns.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dataLoading, setDataLoading] = useState(true);

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
          if (!data.error) {
            setDashboardData(data);
          }
        })
        .catch((error) => {
          console.error("Failed to load dashboard data:", error);
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

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Dashboard"
            description="Activate MarketLock360 for your reserved market, then track setup and page readiness"
          />

          <MerchantActivationBanner merchant={merchant} />

          <MarketLockDashboardCard merchant={merchant} />

          <CampaignTrackPanel
            track={dashboardData?.campaignTrack}
            merchantName={merchant?.businessName}
          />

          {merchant && pageManagement && (
            <MerchantPageManagementPanel
              merchant={merchant}
              pageManagement={pageManagement}
              publicPageHref={publicPageHref}
              editHref="/merchant/profile"
              className="mb-6"
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
