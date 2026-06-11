"use client";

import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  Download,
  Globe2,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  type LucideIcon,
  Mailbox,
  Mic2,
  Music2,
  Pause,
  Play,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { CityTerritoryMap } from "@/components/merchant/city-territory-map";
import {
  type MerchantPageManagementData,
  type MerchantPageManagementMerchant,
  MerchantPageManagementPanel,
} from "@/components/merchant/merchant-page-management-panel";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { cn, getMerchantPageUrl } from "@/lib/utils";
import { merchantNavItems } from "./nav";

interface DashboardData {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
  campaignTrack?: CampaignTrackData;
  radioSpot?: CampaignTrackData;
  merchantTrial?: MerchantTrialData | null;
}

interface CampaignTrackData {
  title: string;
  description: string;
  audioSrc: string | null;
  status: "ready" | "in_production" | "pending";
  updatedAt: string | null;
}

interface MerchantTrialData {
  day: number;
  totalDays: number;
  startedAt: string;
  endsAt: string;
}

const activationStatusMeta = {
  Active: {
    icon: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
    caption: "text-emerald-700 dark:text-emerald-300",
  },
  "In production": {
    icon: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    dot: "bg-blue-500",
    caption: "text-blue-700 dark:text-blue-300",
  },
  Ready: {
    icon: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
    caption: "text-emerald-700 dark:text-emerald-300",
  },
  Waiting: {
    icon: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
    caption: "text-amber-700 dark:text-amber-300",
  },
  Upgrade: {
    icon: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
    caption: "text-primary",
  },
} as const;

// Stub reach figure for sales framing — confirm with the mail vendor before
// this goes in front of merchants.
const reachStats = {
  mailHouseholds: "12,000+",
};

const activationItems = [
  {
    label: "Category lock",
    value: "Exclusive local category position",
    status: "Active",
    icon: ShieldCheck,
  },
  {
    label: "MarketLock status",
    value: "Position reserved and protected",
    status: "Active",
    icon: LockKeyhole,
  },
  {
    label: "Merchant page",
    value: "Customer-facing Local City Places page",
    status: "Active",
    icon: Globe2,
  },
  {
    label: "Radio spot",
    value: "KLCP 96.5 FM ad",
    status: "In production",
    icon: RadioTower,
  },
  {
    label: "Signature soundtrack",
    value: "Custom campaign music bed",
    status: "In production",
    icon: Music2,
  },
  {
    label: "Airplay schedule",
    value: "Opens after audio approval",
    status: "Waiting",
    icon: CalendarClock,
  },
] as const;

const marketLockProAdds = [
  {
    label: "Direct mail",
    detail: `Campaign mailers to ${reachStats.mailHouseholds} households in your protected market.`,
    tag: "Pro",
    icon: Mailbox,
  },
  {
    label: "Sweepstakes traffic",
    detail: "Member nominations, referrals, and campaign engagement.",
    tag: "Pro",
    icon: Sparkles,
  },
  {
    label: "LOCAL AI Staff",
    detail: "Follow-up, appointments, and customer communication support.",
    tag: "Pro",
    icon: Bot,
  },
  {
    label: "Concierge service",
    detail: "Support for market questions, platform help, and next steps.",
    tag: "Pro",
    icon: LifeBuoy,
  },
];

const emptyCaptionsTrack = "data:text/vtt,WEBVTT%0A%0A";

function formatTrackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

// Deterministic pseudo-random bar heights so the waveform renders
// identically on every mount.
const waveformBars = Array.from({ length: 44 }, (_, index) => {
  const blended =
    Math.abs(Math.sin(index * 0.58 + 0.4)) * 0.62 +
    Math.abs(Math.sin(index * 1.73 + 1.2)) * 0.38;
  return { id: `wf-${index}`, height: 0.24 + blended * 0.76 };
});

function CampaignAudioAsset({
  className,
  icon: Icon,
  title,
  subtitle,
  playerLabel,
  track,
  pendingLabel,
  pendingNote,
  accent = "primary",
}: {
  className?: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  playerLabel: string;
  track: CampaignTrackData | undefined;
  pendingLabel: string;
  pendingNote: string;
  accent?: "primary" | "blue";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasAudio = !!track?.audioSrc;
  const progressFraction = duration > 0 ? currentTime / duration : 0;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

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
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            accent === "primary"
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
          )}
        >
          {isPlaying ? (
            <span aria-hidden="true" className="flex h-4 items-end gap-[3px]">
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className="h-full w-[3px] animate-audio-eq rounded-full bg-current"
                  style={{ animationDelay: `${bar * 0.16}s` }}
                />
              ))}
            </span>
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                hasAudio
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
              )}
            >
              {hasAudio ? "Ready to play" : pendingLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2.5">
        <button
          type="button"
          disabled={!hasAudio}
          onClick={togglePlayback}
          aria-label={
            isPlaying ? `Pause ${playerLabel}` : `Play ${playerLabel}`
          }
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
            hasAudio
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95"
              : "cursor-not-allowed border border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground/70",
            isPlaying && "ring-4 ring-primary/15",
          )}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "relative flex h-9 items-center gap-[3px] rounded-md",
              hasAudio && "focus-within:ring-2 focus-within:ring-ring/50",
            )}
          >
            {waveformBars.map((bar, index) => (
              <span
                key={bar.id}
                className={cn(
                  "min-w-0 flex-1 rounded-full transition-colors duration-200",
                  hasAudio
                    ? index / waveformBars.length < progressFraction
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                    : "bg-muted-foreground/15",
                )}
                style={{ height: `${Math.round(bar.height * 100)}%` }}
              />
            ))}
            {hasAudio && (
              <input
                aria-label={`${playerLabel} progress`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                max={duration || 1}
                min={0}
                onChange={(event) => handleSeek(event.target.value)}
                step="0.1"
                type="range"
                value={duration ? currentTime : 0}
              />
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-medium text-muted-foreground">
            {hasAudio ? (
              <>
                <span className="tabular-nums">
                  {formatTrackTime(currentTime)}
                </span>
                <span className="tabular-nums">
                  {formatTrackTime(duration)}
                </span>
              </>
            ) : (
              <>
                <span className="truncate">{pendingNote}</span>
                <span className="tabular-nums">--:--</span>
              </>
            )}
          </div>
        </div>

        {hasAudio && (
          <Button asChild variant="ghost" size="icon" title="Download">
            <a href={track?.audioSrc || undefined} download>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download {playerLabel}</span>
            </a>
          </Button>
        )}
      </div>

      {hasAudio && (
        <audio
          ref={audioRef}
          aria-label={`${playerLabel} player`}
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
      )}
    </div>
  );
}

function CampaignAudioPanel({
  soundtrack,
  radioSpot,
}: {
  soundtrack: CampaignTrackData | undefined;
  radioSpot: CampaignTrackData | undefined;
}) {
  return (
    <section className="mb-4 rounded-xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Campaign audio
          </p>
          <h2 className="mt-1 text-base font-bold tracking-tight">
            Soundtrack and KLCP spot
          </h2>
        </div>
        <p className="text-xs text-muted-foreground sm:text-right">
          Stream or download the audio running with your campaign.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2 xl:divide-x xl:divide-border">
        <CampaignAudioAsset
          icon={Music2}
          title="Signature soundtrack"
          subtitle={soundtrack?.title || "Custom campaign music bed"}
          playerLabel="signature soundtrack"
          track={soundtrack}
          pendingLabel="In production"
          pendingNote="Waiting on audio"
        />
        <CampaignAudioAsset
          icon={Mic2}
          title="KLCP radio spot"
          subtitle={
            radioSpot?.audioSrc
              ? radioSpot.title
              : "Radio spot has not been uploaded yet"
          }
          playerLabel="KLCP radio spot"
          track={radioSpot}
          pendingLabel="Awaiting upload"
          pendingNote="No audio file yet"
          accent="blue"
          className="border-t pt-4 xl:border-t-0 xl:pl-4 xl:pt-0"
        />
      </div>
    </section>
  );
}

function MerchantActivationBanner({
  merchant,
  merchantTrial,
  track,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
  merchantTrial?: MerchantTrialData | null;
  track: CampaignTrackData | undefined;
}) {
  const categoryName = merchant?.categoryName || "Local category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "Your market";
  const totalTools = activationItems.length + marketLockProAdds.length;
  const toolSegments = [
    ...activationItems.map((item) => ({ key: item.label, active: true })),
    ...marketLockProAdds.map((item) => ({ key: item.label, active: false })),
  ];

  return (
    <section className="mb-5 overflow-hidden rounded-xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {merchant?.logoUrl ? (
            <Image
              src={merchant.logoUrl}
              alt={`${merchant.businessName} logo`}
              width={48}
              height={48}
              className="h-10 w-10 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Activated market package
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="truncate text-lg font-bold tracking-tight md:text-xl">
                {categoryName} &middot; {marketLabel}
              </h2>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <LockKeyhole className="h-3 w-3" />
                Lock active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
              {`No other ${categoryName} business in ${marketLabel} can hold this position — it's yours.`}
            </p>
          </div>
        </div>

        <div className="min-w-0 shrink-0 lg:max-w-sm lg:text-right">
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Dashboard
            </h1>
            {merchantTrial && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                <CalendarClock className="h-4 w-4" />
                {`Trial day ${merchantTrial.day} of ${merchantTrial.totalDays}`}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {merchant?.businessName
              ? `Welcome back, ${merchant.businessName}`
              : "Manage your merchant page, campaign media, and customer reviews"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t pt-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MerchantTerritoryMapBlock merchant={merchant} />

        <div className="xl:border-l xl:pl-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Package status
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {`${activationItems.length} of ${totalTools} market tools active`}
            </p>
          </div>
          <div className="mt-3 flex gap-1">
            {toolSegments.map((segment) => (
              <span
                key={segment.key}
                title={segment.key}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  segment.active ? "bg-emerald-500" : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="h-3 w-3 shrink-0" />
            {`${marketLockProAdds.length} tools locked - MarketLock360 Pro turns them on.`}
          </p>
          <ol className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2 2xl:grid-cols-3">
            {activationItems.map((item) => {
              const Icon = item.icon;
              const isSignatureSoundtrack =
                item.label === "Signature soundtrack";
              const itemValue =
                isSignatureSoundtrack && track?.title
                  ? track.title
                  : item.value;
              const itemStatus =
                isSignatureSoundtrack && track?.audioSrc
                  ? "Ready"
                  : item.status;
              const meta = activationStatusMeta[itemStatus];

              return (
                <li key={item.label} className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                      meta.icon,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p
                      className="mt-1 truncate text-sm font-semibold leading-5"
                      title={itemValue}
                    >
                      {itemValue}
                    </p>
                    <p
                      className={cn(
                        "mt-1.5 flex items-center gap-1.5 text-xs font-semibold",
                        meta.caption,
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
                      />
                      {itemStatus}
                    </p>
                  </div>
                </li>
              );
            })}
            {marketLockProAdds.map((item) => {
              const Icon = item.icon;
              const meta = activationStatusMeta.Upgrade;

              return (
                <li key={item.label} className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                      meta.icon,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p
                      className="mt-1 truncate text-sm font-semibold leading-5 text-muted-foreground"
                      title={item.detail}
                    >
                      {item.detail}
                    </p>
                    <p
                      className={cn(
                        "mt-1.5 flex items-center gap-1.5 text-xs font-semibold",
                        meta.caption,
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
                      />
                      Upgrade
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function MerchantTerritoryMapBlock({
  className,
  merchant,
}: {
  className?: string;
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Your territory
      </p>
      <div className="mt-4 flex-1">
        <CityTerritoryMap
          city={merchant?.city}
          state={merchant?.state}
          className="h-56 w-full sm:h-64 xl:h-full xl:min-h-[20rem]"
        />
      </div>
    </div>
  );
}

function MarketLockProUpsellCard({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const categoryName = merchant?.categoryName || "Your category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "your market";

  return (
    <section
      id="marketlock-pro"
      className="mb-6 overflow-hidden rounded-xl border border-primary/25 bg-card shadow-sm"
    >
      <div className="min-w-0 p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Pro subscription upgrade
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Upgrade to MarketLock360 Pro
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              {`Upgrade to keep your subscription active and your ${categoryName} category locked down in ${marketLabel}. The 6 market tools already turned on stay on, and MarketLock360 Pro adds 4 more ways to keep the campaign moving.`}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row xl:flex-col xl:items-end">
            <Button
              type="button"
              size="sm"
              className="h-10 rounded-lg px-4 text-sm font-semibold"
              aria-label="Upgrade today"
            >
              <ArrowUpRight className="h-4 w-4" />
              Upgrade today
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" />4 Pro tools ready to unlock
            </div>
          </div>
        </div>

        <div className="mt-5 grid overflow-hidden rounded-lg border border-border/80 bg-background/45 sm:grid-cols-2">
          {marketLockProAdds.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={cn(
                  "group min-w-0 p-4 transition-colors hover:bg-primary/[0.06]",
                  index > 0 && "border-t",
                  index % 2 === 1 && "sm:border-l",
                  index < 2 && "sm:border-t-0",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 text-sm font-semibold leading-5">
                      {item.label}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
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
          <MerchantActivationBanner
            merchant={merchant}
            merchantTrial={dashboardData?.merchantTrial}
            track={dashboardData?.campaignTrack}
          />

          <CampaignAudioPanel
            radioSpot={dashboardData?.radioSpot}
            soundtrack={dashboardData?.campaignTrack}
          />

          {merchant && pageManagement && (
            <MerchantPageManagementPanel
              merchant={merchant}
              pageManagement={pageManagement}
              publicPageHref={publicPageHref}
              editHref="/merchant/profile"
              className="mb-6"
              queueTone="opportunity"
            />
          )}

          <MarketLockProUpsellCard merchant={merchant} />
        </>
      )}
    </DashboardLayout>
  );
}
