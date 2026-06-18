"use client";

import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  CreditCard,
  Download,
  FileText,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { MarketLockStatusBadge } from "@/components/market-lock-status-badge";
import { CityTerritoryMap } from "@/components/merchant/city-territory-map";
import {
  type MerchantPageManagementData,
  type MerchantPageManagementMerchant,
  MerchantPageManagementPanel,
} from "@/components/merchant/merchant-page-management-panel";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { getMarketLockStatusLabel } from "@/lib/market-lock-status";
import { cn, getMerchantPageUrl } from "@/lib/utils";
import { merchantNavItems } from "./nav";

interface DashboardData {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
  campaignTrack?: CampaignTrackData;
  campaignTracks?: CampaignTrackData[];
  radioSpot?: CampaignTrackData;
  merchantTrial?: MerchantTrialData | null;
  marketLockPaymentHistory?: MarketLockPaymentHistoryItem[];
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

interface MarketLockPaymentHistoryItem {
  id: string;
  agreementPdfUrl: string | null;
  agreementTitle: string;
  agreementVersion: string;
  paidAt: string | null;
  paymentAmountCents: number | null;
  paymentCurrency: string | null;
  paymentStatus: string;
  servicePeriodLabel: string;
  signedAt: string;
  typedName: string;
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
    label: "Radio Spot",
    value: "KLCP 96.5 FM ad",
    status: "In production",
    icon: RadioTower,
  },
  {
    label: "Signature Soundtrack",
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

function formatDashboardDate(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentAmount(
  amountCents: number | null,
  currency: string | null,
) {
  if (!amountCents) return "Amount pending";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}

function getPaymentStatusMeta(status: string) {
  switch (status) {
    case "paid":
    case "no_payment_required":
      return {
        label: "Paid",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "unpaid":
      return {
        label: "Awaiting payment",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    case "agreement_signed":
      return {
        label: "Agreement signed",
        className:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        className: "border-muted-foreground/25 bg-muted text-muted-foreground",
      };
  }
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
  soundtracks,
  radioSpot,
}: {
  soundtracks: CampaignTrackData[];
  radioSpot: CampaignTrackData | undefined;
}) {
  const visibleSoundtrackSlots =
    soundtracks.length > 0
      ? [
          {
            id: "soundtrack",
            title: "Signature Soundtrack 1",
            playerLabel: "Signature Soundtrack 1",
            track: soundtracks[0],
          },
          ...(soundtracks[1]
            ? [
                {
                  id: "soundtrack2",
                  title: "Signature Soundtrack 2",
                  playerLabel: "Signature Soundtrack 2",
                  track: soundtracks[1],
                },
              ]
            : []),
        ]
      : [
          {
            id: "soundtrack",
            title: "Signature Soundtrack 1",
            playerLabel: "Signature Soundtrack 1",
            track: {
              title: "Signature Soundtrack 1",
              description: "A custom audio asset produced for your campaign.",
              audioSrc: null,
              status: "in_production" as const,
              updatedAt: null,
            },
          },
        ];

  return (
    <section className="mb-4 rounded-xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Campaign audio
          </p>
          <h2 className="mt-1 text-base font-bold tracking-tight">
            Soundtracks and KLCP Spot
          </h2>
        </div>
        <p className="text-xs text-muted-foreground sm:text-right">
          Stream or download the audio running with your campaign.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3 xl:divide-x xl:divide-border">
        {visibleSoundtrackSlots.map((slot) => (
          <CampaignAudioAsset
            key={slot.id}
            icon={Music2}
            title={slot.title}
            subtitle={slot.track?.title || "Custom campaign music bed"}
            playerLabel={slot.playerLabel}
            track={slot.track}
            pendingLabel="In production"
            pendingNote="Waiting on audio"
            className={cn(
              slot.id !== "soundtrack" &&
                "border-t pt-4 xl:border-t-0 xl:pl-4 xl:pt-0",
            )}
          />
        ))}
        <CampaignAudioAsset
          icon={Mic2}
          title="KLCP Radio Spot"
          subtitle={
            radioSpot?.audioSrc
              ? radioSpot.title
              : "Radio spot has not been uploaded yet"
          }
          playerLabel="KLCP Radio Spot"
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

function MarketLockPaymentHistoryPanel({
  items,
}: {
  items: MarketLockPaymentHistoryItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            MarketLock360 history
          </p>
          <h2 className="mt-1 text-base font-bold tracking-tight">
            Payments and signed agreements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly service-period payments with the signed agreement attached.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/merchant/marketlock360/agreement">
            <CreditCard className="h-4 w-4" />
            New monthly payment
          </Link>
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border">
        <div className="hidden grid-cols-[1.25fr_0.85fr_0.9fr_0.9fr] gap-4 border-b bg-muted/50 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground md:grid">
          <span>Service period</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Agreement</span>
        </div>
        <div className="divide-y">
          {items.map((item) => {
            const statusMeta = getPaymentStatusMeta(item.paymentStatus);
            const amountLabel = formatPaymentAmount(
              item.paymentAmountCents,
              item.paymentCurrency,
            );

            return (
              <div
                key={item.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.25fr_0.85fr_0.9fr_0.9fr] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold leading-5">
                    {item.servicePeriodLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Signed {formatDashboardDate(item.signedAt)} by{" "}
                    {item.typedName}
                  </p>
                </div>
                <div>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
                      statusMeta.className,
                    )}
                  >
                    {statusMeta.label}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.paidAt
                      ? `Paid ${formatDashboardDate(item.paidAt)}`
                      : "Payment date pending"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{amountLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.paidAt
                      ? "One-time payment recorded"
                      : "One-time payment pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.agreementPdfUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={item.agreementPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText className="h-4 w-4" />
                        Signed PDF
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      PDF pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
  const businessName = merchant?.businessName || "Your business";
  const marketLockStatus = merchant?.marketLockStatus ?? "basic";
  const marketLockStatusLabel = getMarketLockStatusLabel(marketLockStatus);
  const canRequestTrial = marketLockStatus === "basic";
  const hasTrialRequestPending = marketLockStatus === "trial_requested";
  const isMarketLockActive =
    marketLockStatus === "trial" || marketLockStatus === "pro";
  const totalTools = activationItems.length + marketLockProAdds.length;
  const toolSegments = [
    ...activationItems.map((item) => ({
      key: item.label,
      active: item.label === "MarketLock status" ? isMarketLockActive : true,
    })),
    ...marketLockProAdds.map((item) => ({ key: item.label, active: false })),
  ];
  const activeToolCount = toolSegments.filter(
    (segment) => segment.active,
  ).length;
  const packageEyebrow = canRequestTrial
    ? "Market package preview"
    : hasTrialRequestPending
      ? "Trial request pending"
      : "Activated market package";
  const packageProgressLabel =
    canRequestTrial || hasTrialRequestPending
      ? "Trial access"
      : "Package status";
  const packageProgressText =
    canRequestTrial || hasTrialRequestPending
      ? `${activeToolCount} of ${totalTools} market tools ready`
      : `${activeToolCount} of ${totalTools} market tools active`;
  const lockedToolsText =
    canRequestTrial || hasTrialRequestPending
      ? "MarketLock360 tools unlock after the trial is accepted."
      : `${marketLockProAdds.length} tools locked - MarketLock360 Pro turns them on.`;

  return (
    <section className="mb-5 overflow-hidden rounded-xl border bg-card p-4 md:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 pt-1">
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
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {packageEyebrow}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 xl:flex-nowrap">
            <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {businessName}
            </h1>
            <span className="hidden h-7 w-px shrink-0 bg-border sm:block" />
            <p className="shrink-0 text-base font-bold tracking-tight text-foreground md:text-xl">
              {categoryName} in {marketLabel}
            </p>
            {!merchantTrial && !canRequestTrial && (
              <MarketLockStatusBadge status={marketLockStatus} />
            )}
            {merchantTrial && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary xl:ml-auto">
                <CalendarClock className="h-4 w-4" />
                {`Trial day ${merchantTrial.day} of ${merchantTrial.totalDays}`}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
            {canRequestTrial
              ? "MarketLock360 trial access is ready when you request it."
              : hasTrialRequestPending
                ? "Your MarketLock360 trial request is in the admin queue and is not active yet."
                : `No other ${categoryName} business in ${marketLabel} can hold this position while your ${marketLockStatusLabel.toLowerCase()} is active.`}
          </p>
          {canRequestTrial && (
            <Button
              asChild
              size="sm"
              className="mt-3 h-10 rounded-lg px-4 text-sm font-semibold md:hidden"
            >
              <Link href="/merchant/marketlock360#trial">
                <ArrowUpRight className="h-4 w-4" />
                Request MarketLock360 trial
              </Link>
            </Button>
          )}
        </div>

        {canRequestTrial && (
          <Button
            asChild
            size="sm"
            className="ml-auto hidden h-10 shrink-0 rounded-lg px-4 text-sm font-semibold md:inline-flex"
          >
            <Link href="/merchant/marketlock360#trial">
              <ArrowUpRight className="h-4 w-4" />
              Request MarketLock360 trial
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4 border-t pt-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MerchantTerritoryMapBlock merchant={merchant} />

        <div className="xl:border-l xl:pl-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {packageProgressLabel}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {packageProgressText}
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
            {lockedToolsText}
          </p>
          <ol className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2 2xl:grid-cols-3">
            {activationItems.map((item) => {
              const Icon = item.icon;
              const isSignatureSoundtrack =
                item.label === "Signature Soundtrack";
              const itemValue =
                item.label === "MarketLock status"
                  ? canRequestTrial
                    ? "Trial ready"
                    : hasTrialRequestPending
                      ? "Request pending"
                      : marketLockStatusLabel
                  : isSignatureSoundtrack && track?.title
                    ? track.title
                    : item.value;
              const itemStatus =
                item.label === "MarketLock status" &&
                (marketLockStatus === "basic" || hasTrialRequestPending)
                  ? "Waiting"
                  : isSignatureSoundtrack && track?.audioSrc
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
              asChild
              size="sm"
              className="h-10 rounded-lg px-4 text-sm font-semibold"
            >
              <Link href="/merchant/marketlock360/agreement">
                <ArrowUpRight className="h-4 w-4" />
                Upgrade today
              </Link>
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

function MarketLockTrialCtaCard({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const categoryName = merchant?.categoryName || "your category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "your market";

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-orange-300/30 bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                MarketLock360 trial
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Request your protected-market trial
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {`Request trial access for ${categoryName} in ${marketLabel}. You can review the trial offer and start from the MarketLock360 page.`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              "14-day trial",
              "Category lock preview",
              "Upgrade when ready",
            ].map((item) => (
              <div
                key={item}
                className="flex min-h-11 items-center gap-2 rounded-lg border bg-background/45 px-3 py-2 text-sm font-semibold"
              >
                <Check className="h-4 w-4 shrink-0 text-orange-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 border-t bg-orange-500/[0.04] p-5 lg:border-l lg:border-t-0 md:p-6">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            Not in trial yet. Jump straight to the trial section and request
            access.
          </p>
          <Button
            asChild
            className="h-11 rounded-lg px-4 text-sm font-semibold"
          >
            <Link href="/merchant/marketlock360#trial">
              <ArrowUpRight className="h-4 w-4" />
              Request MarketLock360 trial
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function MarketLockTrialPendingCard({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const categoryName = merchant?.categoryName || "your category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "your market";

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-amber-300/30 bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              MarketLock360 trial request
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Waiting for admin acceptance
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {`Your request for ${categoryName} in ${marketLabel} is in the admin queue. Trial access starts after it is accepted.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          <CalendarClock className="h-4 w-4" />
          Request pending
        </div>
      </div>
    </section>
  );
}

function MarketLockDashboardBottomCta({
  merchant,
}: {
  merchant: MerchantPageManagementMerchant | undefined;
}) {
  const marketLockStatus = merchant?.marketLockStatus ?? "basic";

  if (marketLockStatus === "pro") {
    return null;
  }

  if (marketLockStatus === "trial") {
    return <MarketLockProUpsellCard merchant={merchant} />;
  }

  if (marketLockStatus === "trial_requested") {
    return <MarketLockTrialPendingCard merchant={merchant} />;
  }

  return <MarketLockTrialCtaCard merchant={merchant} />;
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
    merchant?.isPublicPage && merchant.city && merchant.state && merchant.slug
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
            soundtracks={
              dashboardData?.campaignTracks ||
              (dashboardData?.campaignTrack
                ? [dashboardData.campaignTrack]
                : [])
            }
          />

          <MarketLockPaymentHistoryPanel
            items={dashboardData?.marketLockPaymentHistory || []}
          />

          {merchant && pageManagement && (
            <MerchantPageManagementPanel
              merchant={merchant}
              pageManagement={pageManagement}
              publicPageHref={publicPageHref}
              editHref="/merchant/page-editor"
              editLabel="Edit Merchant Page"
              className="mb-6"
              queueTone="opportunity"
            />
          )}

          <MarketLockDashboardBottomCta merchant={merchant} />
        </>
      )}
    </DashboardLayout>
  );
}
