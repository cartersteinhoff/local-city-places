"use client";

import {
  CheckCircle2,
  CircleDashed,
  Download,
  ExternalLink,
  FileAudio,
  Globe2,
  Loader2,
  LockKeyhole,
  type LucideIcon,
  Mic2,
  Music2,
  Pause,
  Play,
  Radio,
  RadioTower,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRadioPlayback } from "@/components/radio-playback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudioMode = "merchant" | "admin";

interface OnAirStudioContentProps {
  mode?: StudioMode;
  merchantId?: string;
  merchantName?: string | null;
  publicPageHref?: string | null;
  backHref?: string;
  campaignAudio?: CampaignAudio | null;
}

type StatusTone = "active" | "ready" | "waiting";
type DeliverableType = "audio" | "proof";
type CampaignAudioKind = "radioSpot" | "soundtrack" | "soundtrack2";

interface CampaignAudioAsset {
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  status?: "ready" | "in_production" | "pending";
}

interface CampaignAudio {
  radioSpot?: CampaignAudioAsset | null;
  soundtrack?: CampaignAudioAsset | null;
  soundtrack2?: CampaignAudioAsset | null;
  updatedAt?: string;
}

interface StudioDeliverable {
  key: string;
  title: string;
  status: string;
  statusTone: StatusTone;
  description: string;
  icon: LucideIcon;
  type: DeliverableType;
  uploadTitle: string;
  uploadHint: string;
  audioSrc?: string | null;
}

const deliverables = [
  {
    key: "radio-spot",
    title: "Radio Spot",
    status: "In production",
    statusTone: "active",
    description: "Final produced ad for KLCP 96.5 FM.",
    icon: Mic2,
    type: "audio",
    uploadTitle: "Radio Spot Audio",
    uploadHint: "Upload the approved MP3 or WAV.",
    audioSrc: null,
  },
  {
    key: "soundtrack",
    title: "Signature Soundtrack 1",
    status: "In production",
    statusTone: "active",
    description: "Custom music bed for the merchant campaign.",
    icon: Music2,
    uploadTitle: "Signature Soundtrack 1 Audio",
    uploadHint: "Upload the final MP3 or WAV.",
    type: "audio",
    audioSrc: null,
  },
  {
    key: "soundtrack-2",
    title: "Signature Soundtrack 2",
    status: "In production",
    statusTone: "active",
    description: "Second custom music bed for the merchant campaign.",
    icon: Music2,
    uploadTitle: "Signature Soundtrack 2 Audio",
    uploadHint: "Upload the alternate final MP3 or WAV.",
    type: "audio",
    audioSrc: null,
  },
  {
    key: "public-page",
    title: "Public merchant page",
    status: "Prepared",
    statusTone: "ready",
    description: "Customer-facing page and final share URL.",
    icon: Globe2,
    uploadTitle: "Public page proof or final link",
    uploadHint: "Add the URL, screenshot, or notes.",
    type: "proof",
  },
  {
    key: "category-reservation",
    title: "Exclusive category reservation",
    status: "Reserved",
    statusTone: "ready",
    description: "Reserved market and category position.",
    icon: LockKeyhole,
    uploadTitle: "Category reservation confirmation",
    uploadHint: "Add category, market, and date.",
    type: "proof",
  },
  {
    key: "airplay",
    title: "Airplay schedule",
    status: "Needs spot approval",
    statusTone: "waiting",
    description: "KLCP placement after the radio spot is approved.",
    icon: RadioTower,
    uploadTitle: "Airplay schedule or proof",
    uploadHint: "Add schedule, run log, or confirmation.",
    type: "proof",
  },
] satisfies StudioDeliverable[];

const merchantServices = [
  {
    key: "radio-spot",
    title: "Custom radio spot",
    category: "Audio production",
    status: "In production",
    statusTone: "active",
    description:
      "A produced KLCP 96.5 FM spot that introduces your business and gives listeners a reason to check you out.",
    icon: Mic2,
    hasPreview: true,
    audioSrc: null,
  },
  {
    key: "soundtrack",
    title: "Signature Soundtrack 1",
    category: "Brand sound",
    status: "In production",
    statusTone: "active",
    description:
      "A custom music bed that gives your Local City Places campaign a recognizable sound.",
    icon: Music2,
    hasPreview: true,
    audioSrc: null,
  },
  {
    key: "soundtrack-2",
    title: "Signature Soundtrack 2",
    category: "Brand sound",
    status: "In production",
    statusTone: "active",
    description:
      "An alternate custom music bed produced for your Local City Places campaign.",
    icon: Music2,
    hasPreview: true,
    audioSrc: null,
  },
  {
    key: "public-page",
    title: "Public merchant page",
    category: "Customer page",
    status: "Prepared",
    statusTone: "ready",
    description:
      "A shareable page with your business story, contact details, and customer calls to action.",
    icon: Globe2,
    hasPreview: false,
  },
  {
    key: "category-reservation",
    title: "Category reservation",
    category: "Market position",
    status: "Reserved",
    statusTone: "ready",
    description:
      "Your business is reserved in its category so the campaign has a clear local lane.",
    icon: LockKeyhole,
    hasPreview: false,
  },
  {
    key: "airplay",
    title: "KLCP airplay",
    category: "Broadcast placement",
    status: "After approval",
    statusTone: "waiting",
    description:
      "Approved audio is scheduled for KLCP 96.5 FM, with confirmation added when airplay is ready.",
    icon: RadioTower,
    hasPreview: false,
  },
] satisfies Array<
  Pick<
    StudioDeliverable,
    "key" | "title" | "status" | "statusTone" | "description" | "icon"
  > & {
    category: string;
    hasPreview: boolean;
    audioSrc?: string | null;
  }
>;

const statusToneClasses = {
  active: "border-primary/30 bg-primary/10 text-primary",
  ready: "border-success/30 bg-success/10 text-success",
  waiting: "border-muted-foreground/25 bg-muted text-muted-foreground",
} satisfies Record<StatusTone, string>;

const emptyCaptionsTrack = "data:text/vtt,WEBVTT%0A%0A";

// Static decorative waveform for the audio scrubbers. Deterministic so the
// server and client render identical bars.
const WAVEFORM_BARS = Array.from({ length: 36 }, (_, index) => ({
  id: `wave-${index}`,
  height: 32 + Math.round(56 * Math.abs(Math.sin((index + 1) * 2.1))),
}));

const STATION_EQ_BARS = [
  { id: "eq-1", height: 55, delay: 0 },
  { id: "eq-2", height: 90, delay: 0.32 },
  { id: "eq-3", height: 70, delay: 0.12 },
  { id: "eq-4", height: 100, delay: 0.44 },
  { id: "eq-5", height: 48, delay: 0.22 },
];

function getAudioAssetForKey(
  campaignAudio: CampaignAudio | null | undefined,
  key: string,
) {
  if (key === "radio-spot") return campaignAudio?.radioSpot || null;
  if (key === "soundtrack") return campaignAudio?.soundtrack || null;
  if (key === "soundtrack-2") return campaignAudio?.soundtrack2 || null;
  return null;
}

function getAudioKindForKey(key: string): CampaignAudioKind | null {
  if (key === "radio-spot") return "radioSpot";
  if (key === "soundtrack") return "soundtrack";
  if (key === "soundtrack-2") return "soundtrack2";
  return null;
}

function applyCampaignAudio<
  T extends {
    key: string;
    title: string;
    description: string;
    status: string;
    statusTone: StatusTone;
    audioSrc?: string | null;
  },
>(items: readonly T[], campaignAudio: CampaignAudio | null | undefined) {
  return items.map((item) => {
    const asset = getAudioAssetForKey(campaignAudio, item.key);

    if (!asset?.url) return item;

    return {
      ...item,
      title: asset.title || item.title,
      description: asset.description || item.description,
      status: "Ready",
      statusTone: "ready" as StatusTone,
      audioSrc: asset.url,
    };
  });
}

function AdminAudioUploadControl({
  item,
  merchantId,
  onUploaded,
}: {
  item: {
    key: string;
    title: string;
    description: string;
    audioSrc?: string | null;
  };
  merchantId?: string;
  onUploaded: (campaignAudio: CampaignAudio) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const kind = getAudioKindForKey(item.key);
  const canUpload = Boolean(kind && merchantId);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");

    if (!file || !kind || !merchantId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    if (item.audioSrc) {
      formData.append("title", item.title);
      formData.append("description", item.description);
    }

    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/admin/merchants/${merchantId}/campaign-audio`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload audio");
      }

      onUploaded(data.campaignAudio);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload audio",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 sm:text-right">
      <input
        ref={inputRef}
        accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,.mp3,.m4a,.aac,.wav"
        className="sr-only"
        disabled={!canUpload || isUploading}
        onChange={handleFileChange}
        type="file"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={!canUpload || isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        {item.audioSrc ? "Replace" : "Upload"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function StudioStatusBadge({
  status,
  tone,
}: {
  status: string;
  tone: StatusTone;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5", statusToneClasses[tone])}
    >
      {status}
    </Badge>
  );
}

function StationSignalCard() {
  const { isPlaying } = useRadioPlayback();

  return (
    <div className="relative overflow-hidden rounded-xl border bg-background/50 p-5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(24rem_circle_at_100%_0%,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Broadcasting on
          </p>
          <p className="mt-2 text-4xl font-black tracking-tight">
            96.5
            <span className="ml-1.5 text-base font-bold text-muted-foreground">
              FM
            </span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                isPlaying
                  ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                  : "bg-muted-foreground/40",
              )}
              aria-hidden="true"
            />
            <span>KLCP · {isPlaying ? "On air now" : "Local radio"}</span>
          </div>
        </div>

        <span
          className="flex h-14 shrink-0 items-end gap-[3px] text-primary"
          aria-hidden="true"
        >
          {STATION_EQ_BARS.map((bar) => (
            <span
              key={bar.id}
              className={cn(
                "w-1 rounded-full bg-current",
                isPlaying
                  ? "animate-audio-eq"
                  : "origin-bottom scale-y-[0.45] opacity-50",
              )}
              style={{
                height: `${bar.height}%`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function LiveRadioStudioPlayer() {
  const { isPlaying, nowPlaying, playerStatus, streamError, togglePlayback } =
    useRadioPlayback();
  const [failedArtworkUrl, setFailedArtworkUrl] = useState<string | null>(null);
  const playbackLabel = isPlaying ? "Pause KLCP Radio" : "Play KLCP Radio";
  const statusText = {
    idle: "Ready",
    loading: "Connecting",
    playing: "Live now",
    paused: "Paused",
    error: "Stream unavailable",
  }[playerStatus];
  const hasTrackArtwork = Boolean(
    nowPlaying.artworkUrl && failedArtworkUrl !== nowPlaying.artworkUrl,
  );

  return (
    <section className="overflow-hidden rounded-lg border border-sky-200/15 bg-[#031624] p-4 text-white shadow-xl shadow-black/15 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-orange-500" />
            <p className="text-xl font-black uppercase italic leading-none">
              KLCP <span className="text-orange-500">Radio</span>
            </p>
          </div>
          <p className="mt-1 text-xs font-medium text-white/72">
            The Soundtrack of the Phoenix Metro
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-[4px] border border-red-300/70 bg-red-600 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(239,68,68,0.5)]">
            On Air
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-xs font-black uppercase text-sky-100">
            96.5 FM
          </span>
        </div>
      </div>

      <div className="rounded-[8px] bg-[#031b2d] p-3 ring-1 ring-sky-200/15">
        <div className="grid min-w-0 gap-4 sm:grid-cols-[120px_minmax(0,1fr)] xl:grid-cols-1">
          <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-[8px] bg-[#07131d] ring-1 ring-white/15 sm:max-w-[120px] xl:max-w-[210px]">
            {hasTrackArtwork ? (
              <Image
                src={nowPlaying.artworkUrl ?? ""}
                alt={`Artwork for ${nowPlaying.title}`}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 210px, 180px"
                onError={() => setFailedArtworkUrl(nowPlaying.artworkUrl)}
              />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#0b4f80_0%,#01233f_58%,#07131d_100%)] p-5 text-center text-white">
                <Radio className="mb-3 h-10 w-10 text-orange-400" />
                <span className="text-lg font-black uppercase leading-tight">
                  KLCP Radio
                </span>
                <span className="mt-1 text-sm font-bold text-white/75">
                  96.5 FM
                </span>
              </span>
            )}
          </div>

          <div
            className="min-w-0 text-center sm:text-left xl:text-center"
            aria-live="polite"
          >
            <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-orange-400">
              Now Playing
            </p>
            <h2 className="line-clamp-2 text-base font-black leading-tight text-white [overflow-wrap:anywhere] sm:text-lg xl:text-xl">
              {nowPlaying.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-white/78 sm:text-base">
              {nowPlaying.subtitle}
            </p>
          </div>
        </div>

        <div className="my-4 h-px bg-white/15" />

        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center xl:grid-cols-1">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={playerStatus === "loading"}
            className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-400 text-slate-950 shadow-lg shadow-black/25 transition hover:scale-[1.03] hover:bg-sky-300 disabled:cursor-wait disabled:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-16 sm:w-16"
            aria-label={playbackLabel}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
            ) : (
              <Play
                className="ml-1 h-6 w-6 sm:h-7 sm:w-7"
                fill="currentColor"
              />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex min-h-5 items-center justify-center gap-2">
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  playerStatus === "playing" &&
                    "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]",
                  playerStatus === "loading" && "animate-pulse bg-sky-300",
                  (playerStatus === "idle" || playerStatus === "paused") &&
                    "bg-white/45",
                  playerStatus === "error" && "bg-orange-500",
                )}
              />
              <span className="text-base font-black text-white">
                {statusText}
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/25">
              <span
                className={cn(
                  "block h-full rounded-full bg-sky-400 transition-all duration-300",
                  playerStatus === "playing" && "w-full",
                  playerStatus === "loading" && "w-full animate-pulse",
                  playerStatus !== "playing" &&
                    playerStatus !== "loading" &&
                    "w-0",
                )}
              />
            </div>
          </div>
        </div>

        {streamError && (
          <p className="mt-3 truncate whitespace-nowrap text-xs text-orange-200">
            {streamError}
          </p>
        )}

        <p className="mt-5 text-center text-sm font-bold text-white/75">
          Powered by <span className="font-black text-orange-500">KLCP</span>{" "}
          96.5 FM
        </p>
      </div>
    </section>
  );
}

function AudioPlayer({
  audioSrc,
  title,
}: {
  audioSrc?: string | null;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasAudio = !!audioSrc;
  const progressMax = duration || 1;
  const progressValue = duration ? currentTime : 0;
  const progressFraction = duration ? Math.min(1, currentTime / duration) : 0;

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
    <div className="space-y-2">
      <div className="rounded-lg border bg-background/80 p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!hasAudio}
            onClick={togglePlayback}
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              hasAudio
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "cursor-not-allowed border border-muted bg-muted/40 text-muted-foreground",
            )}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
            )}
          </button>

          <div className="relative h-10 min-w-0 flex-1 rounded has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60">
            <div
              className="flex h-full items-center gap-[2px]"
              aria-hidden="true"
            >
              {WAVEFORM_BARS.map((bar, index) => (
                <span
                  key={bar.id}
                  className={cn(
                    "min-w-0 flex-1 rounded-full transition-colors duration-150",
                    !hasAudio && "bg-muted-foreground/15",
                    hasAudio &&
                      (progressFraction >= (index + 1) / WAVEFORM_BARS.length
                        ? "bg-primary"
                        : "bg-muted-foreground/25"),
                  )}
                  style={{ height: `${bar.height}%` }}
                />
              ))}
            </div>
            <input
              aria-label={`${title} progress`}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
              disabled={!hasAudio}
              max={progressMax}
              min={0}
              onChange={(event) => handleSeek(event.target.value)}
              step="0.1"
              type="range"
              value={progressValue}
            />
          </div>

          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {formatAudioTime(currentTime)}
            <span className="mx-0.5 text-muted-foreground/50">/</span>
            {formatAudioTime(duration)}
          </span>
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
        src={audioSrc || undefined}
      >
        <track
          default
          kind="captions"
          label="Captions"
          src={emptyCaptionsTrack}
        />
      </audio>
      <div className="flex min-h-[20px] items-center gap-2 text-xs text-muted-foreground">
        <FileAudio className="h-4 w-4 shrink-0" />
        <span>
          {audioSrc
            ? "Ready to preview in this studio."
            : "Preview pending until final audio is uploaded."}
        </span>
      </div>
    </div>
  );
}

function AudioDownloadButton({ audioSrc }: { audioSrc?: string | null }) {
  if (audioSrc) {
    return (
      <Button variant="outline" size="sm" asChild className="w-full">
        <a href={audioSrc} download>
          <Download className="h-4 w-4" />
          Download
        </a>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled className="w-full">
      <Download className="h-4 w-4" />
      Download pending
    </Button>
  );
}

function MerchantServicesOverview({
  displayName,
  campaignAudio,
}: {
  displayName: string;
  publicPageHref?: string | null;
  campaignAudio?: CampaignAudio | null;
}) {
  const services = applyCampaignAudio(merchantServices, campaignAudio);
  const audioServices = services.filter((service) => service.hasPreview);
  const airplayServices = services.filter(
    (service) => service.key === "airplay",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RadioTower className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              On-Air Studio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Radio production, audio previews, and KLCP 96.5 FM airplay status.
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-6 bg-[radial-gradient(50rem_circle_at_-10%_-80%,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_60%)] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                KLCP 96.5 FM
              </span>
              <span>Radio production</span>
              <span className="hidden sm:inline">Airplay</span>
            </div>
            <h2 className="max-w-2xl text-2xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-3xl">
              Radio campaign
              <span className="block text-primary">for {displayName}.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-muted-foreground sm:text-base">
              Follow the spot, soundtrack, and airplay schedule from production
              through approval.
            </p>
          </div>

          <StationSignalCard />
        </div>

        <div className="grid border-t lg:grid-cols-[1fr_0.9fr] lg:divide-x">
          <div className="p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                Studio deliverables
              </p>
              <h2 className="mt-1.5 text-lg font-bold">Audio production</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preview and download the final files when production is
                complete.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {audioServices.map((service) => {
                const Icon = service.icon;

                return (
                  <article
                    key={service.key}
                    className="flex min-h-[248px] flex-col rounded-lg border bg-background/40 p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <StudioStatusBadge
                        status={service.status}
                        tone={service.statusTone}
                      />
                    </div>
                    <h3 className="font-semibold text-balance">
                      {service.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <AudioPlayer
                        audioSrc={service.audioSrc}
                        title={service.title}
                      />
                      <AudioDownloadButton audioSrc={service.audioSrc} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="border-t p-5 sm:p-6 lg:border-t-0">
            <LiveRadioStudioPlayer />
          </div>
        </div>

        <div className="border-t p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                Path to airplay
              </p>
              <h2 className="mt-1.5 text-lg font-bold">Airplay readiness</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                KLCP placement unlocks after the final spot is approved.
              </p>
            </div>
          </div>

          <ol className="grid gap-4 lg:grid-cols-3">
            {airplayServices.map((service) => {
              const Icon = service.icon;

              return (
                <li
                  key={service.key}
                  className="rounded-lg border bg-background/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {service.category}
                        </p>
                        <StudioStatusBadge
                          status={service.status}
                          tone={service.statusTone}
                        />
                      </div>
                      <h3 className="mt-1 text-sm font-semibold">
                        {service.title}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="rounded-lg border bg-background/40 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">Approval gate</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    The final radio spot is reviewed before airplay dates are
                    confirmed.
                  </p>
                </div>
              </div>
            </li>
            <li className="rounded-lg border bg-background/40 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                  <RadioTower className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">
                    Broadcast confirmation
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Airplay details will appear here when the schedule is ready.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

export function OnAirStudioContent({
  mode = "merchant",
  merchantId,
  merchantName,
  publicPageHref,
  backHref,
  campaignAudio,
}: OnAirStudioContentProps) {
  const isAdmin = mode === "admin";
  const displayName = merchantName || "your business";
  const [localCampaignAudio, setLocalCampaignAudio] =
    useState<CampaignAudio | null>(campaignAudio || null);

  useEffect(() => {
    setLocalCampaignAudio(campaignAudio || null);
  }, [campaignAudio]);

  const effectiveCampaignAudio = localCampaignAudio || campaignAudio;

  if (!isAdmin) {
    return (
      <MerchantServicesOverview
        displayName={displayName}
        campaignAudio={effectiveCampaignAudio}
        publicPageHref={publicPageHref}
      />
    );
  }

  const studioDeliverables = applyCampaignAudio(
    deliverables,
    effectiveCampaignAudio,
  );
  const audioDeliverables = studioDeliverables.filter(
    (item) => item.type === "audio",
  );
  const proofDeliverables = studioDeliverables.filter(
    (item) => item.type === "proof",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {backHref && (
            <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
              <Link href={backHref}>Back to merchant</Link>
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RadioTower className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                On-Air Studio
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {isAdmin
                  ? `Production files and confirmations for ${displayName}.`
                  : "Preview finished media, download files, and follow your KLCP package."}
              </p>
            </div>
          </div>
        </div>

        {publicPageHref && (
          <Button variant="outline" asChild>
            <Link href={publicPageHref}>
              <ExternalLink className="h-4 w-4" />
              View public page
            </Link>
          </Button>
        )}
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4">
              KLCP package
            </Badge>
            <h2 className="max-w-xl text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {isAdmin
                ? `Work order for ${displayName}`
                : `Media package for ${displayName}`}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {isAdmin
                ? "Add the final audio, proof links, reservation details, and airplay confirmation from this page."
                : "Listen to finished files, download approved assets, and see what is ready for KLCP airplay."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border-l-2 border-primary/70 pl-3">
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs leading-4 text-muted-foreground">
                audio files
              </p>
            </div>
            <div className="border-l-2 border-success/70 pl-3">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs leading-4 text-muted-foreground">
                confirmations ready
              </p>
            </div>
            <div className="border-l-2 border-muted-foreground/40 pl-3">
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs leading-4 text-muted-foreground">
                schedule pending
              </p>
            </div>
          </div>
        </div>

        <ol className="grid divide-y border-t md:grid-cols-5 md:divide-x md:divide-y-0">
          {studioDeliverables.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.key} className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <StudioStatusBadge
                    status={item.status}
                    tone={item.statusTone}
                  />
                </div>
                <h3 className="text-sm font-semibold leading-snug">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-lg border bg-card">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Audio deliverables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finished files appear here with preview and download controls.
            </p>
          </div>

          <div className="divide-y">
            {audioDeliverables.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.key} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StudioStatusBadge
                      status={item.status}
                      tone={item.statusTone}
                    />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <AudioPlayer audioSrc={item.audioSrc} title={item.title} />
                    <AudioDownloadButton audioSrc={item.audioSrc} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Campaign setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Page, category, and airplay confirmations for this merchant.
            </p>
          </div>

          <div className="divide-y">
            {proofDeliverables.map((item) => {
              const Icon = item.icon;
              const showPublicPageLink =
                item.key === "public-page" && publicPageHref;

              return (
                <article key={item.key} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StudioStatusBadge
                      status={item.status}
                      tone={item.statusTone}
                    />
                  </div>

                  {showPublicPageLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="mt-4"
                    >
                      <Link href={publicPageHref}>
                        <ExternalLink className="h-4 w-4" />
                        Open page
                      </Link>
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-lg border bg-card p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Admin checklist</h2>
              <p className="text-sm text-muted-foreground">
                Add only the files or proof needed to move each item forward.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <UploadCloud className="h-3 w-3" />
              Upload slots
            </Badge>
          </div>

          <div className="-mx-5 divide-y border-y sm:-mx-6">
            {studioDeliverables.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {item.uploadTitle}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.uploadHint}
                      </p>
                    </div>
                  </div>
                  {item.type === "audio" ? (
                    <AdminAudioUploadControl
                      item={item}
                      merchantId={merchantId}
                      onUploaded={setLocalCampaignAudio}
                    />
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <UploadCloud className="h-4 w-4" />
                      Upload
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {isAdmin ? (
              <CircleDashed className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="font-semibold">
              {isAdmin ? "Next admin step" : "What happens next"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isAdmin
                ? "Upload the final spot first. Once it is approved, the airplay schedule can be confirmed."
                : "When the radio spot and soundtrack are uploaded, preview and download controls will become available here."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
