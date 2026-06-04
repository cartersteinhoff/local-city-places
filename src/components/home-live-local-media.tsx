"use client";

import { Pause, Play, Radio, RadioTower } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const cityColumns = [
  [
    "Ahwatukee",
    "Apache Junction",
    "Avondale",
    "Buckeye",
    "Casa Grande",
    "Chandler",
  ],
  [
    "El Mirage",
    "Florence",
    "Fountain Hills",
    "Gilbert",
    "Glendale",
    "Goodyear",
  ],
  ["Laveen", "Maricopa", "Mesa", "Peoria", "Phoenix", "Queen Creek"],
  [
    "San Tan Valley",
    "Scottsdale",
    "Sun City",
    "Sun City West",
    "Surprise",
    "Tempe",
  ],
];

const radioStreamUrl = "https://s5.radio.co/sabc365e3e/listen";
const radioTrackApiUrl =
  "https://public.radio.co/api/v2/sabc365e3e/track/current";
const radioTrackEventsUrl = `https://mercure.radio.co/.well-known/mercure?topic=${encodeURIComponent(
  radioTrackApiUrl,
)}`;
const metadataFallbackRefreshMs = 15_000;

type RadioTrackApiResponse = {
  data?: {
    title?: unknown;
    start_time?: unknown;
    artwork_urls?: {
      standard?: unknown;
      large?: unknown;
    };
    track_artist?: unknown;
    track_title?: unknown;
    track_album?: unknown;
  };
};

type NowPlayingTrack = {
  title: string;
  subtitle: string;
  artworkUrl: string | null;
  startTime: string | null;
};

const fallbackNowPlaying: NowPlayingTrack = {
  title: "KLCP Radio",
  subtitle: "Live from Phoenix 96.5 FM",
  artworkUrl: null,
  startTime: null,
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNowPlaying(
  payload: RadioTrackApiResponse,
): NowPlayingTrack | null {
  const track = payload.data;
  if (!track) return null;

  const title =
    stringValue(track.track_title) ||
    stringValue(track.title) ||
    fallbackNowPlaying.title;
  const artist = stringValue(track.track_artist);
  const album = stringValue(track.track_album);
  const subtitle =
    artist && artist !== title
      ? artist
      : album && album !== title
        ? album
        : fallbackNowPlaying.subtitle;
  const artworkUrl =
    stringValue(track.artwork_urls?.large) ||
    stringValue(track.artwork_urls?.standard) ||
    null;
  const startTime = stringValue(track.start_time) || null;

  return { title, subtitle, artworkUrl, startTime };
}

function Waveform() {
  const bars = [
    { id: "a", height: 18 },
    { id: "b", height: 28 },
    { id: "c", height: 20 },
    { id: "d", height: 34 },
    { id: "e", height: 44 },
    { id: "f", height: 30 },
    { id: "g", height: 52 },
    { id: "h", height: 24 },
    { id: "i", height: 40 },
    { id: "j", height: 58 },
    { id: "k", height: 36 },
    { id: "l", height: 26 },
    { id: "m", height: 48 },
    { id: "n", height: 32 },
    { id: "o", height: 42 },
    { id: "p", height: 20 },
    { id: "q", height: 30 },
  ];

  return (
    <div className="flex h-14 items-center gap-1.5 text-sky-400">
      {bars.map((bar) => (
        <span
          key={bar.id}
          className="w-1 rounded-full bg-current shadow-[0_0_12px_rgba(14,165,233,0.45)]"
          style={{ height: bar.height }}
        />
      ))}
    </div>
  );
}

function RadioCoPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<
    "idle" | "loading" | "playing" | "paused" | "error"
  >("idle");
  const [streamError, setStreamError] = useState("");
  const [nowPlaying, setNowPlaying] =
    useState<NowPlayingTrack>(fallbackNowPlaying);
  const [artworkFailed, setArtworkFailed] = useState(false);
  const playbackLabel = isPlaying ? "Pause KLCP Radio" : "Play KLCP Radio";
  const statusText = {
    idle: "Ready",
    loading: "Connecting",
    playing: "Live now",
    paused: "Paused",
    error: "Stream unavailable",
  }[playerStatus];
  const hasTrackArtwork = Boolean(nowPlaying.artworkUrl && !artworkFailed);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function refreshNowPlaying() {
      try {
        const response = await fetch(radioTrackApiUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as RadioTrackApiResponse;
        const nextTrack = normalizeNowPlaying(payload);
        if (isMounted && nextTrack) {
          setNowPlaying(nextTrack);
          setArtworkFailed(false);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    refreshNowPlaying();
    const eventSource =
      typeof EventSource === "undefined"
        ? null
        : new EventSource(radioTrackEventsUrl);
    if (eventSource) {
      eventSource.onmessage = () => {
        refreshNowPlaying();
      };
    }

    const intervalId = window.setInterval(
      refreshNowPlaying,
      metadataFallbackRefreshMs,
    );

    return () => {
      isMounted = false;
      controller.abort();
      eventSource?.close();
      window.clearInterval(intervalId);
    };
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setStreamError("");
      setPlayerStatus("loading");
      if (audio.error) {
        audio.load();
      }
      await audio.play();
    } catch {
      setIsPlaying(false);
      setPlayerStatus("error");
      setStreamError("KLCP is not responding. Please try again in a moment.");
    }
  }

  return (
    <div className="mx-auto w-full">
      {/* biome-ignore lint/a11y/useMediaCaption: This is a live radio stream without a captions feed. */}
      <audio
        ref={audioRef}
        src={radioStreamUrl}
        preload="none"
        playsInline
        onPlay={() => {
          setIsPlaying(true);
          setPlayerStatus("playing");
          setStreamError("");
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setPlayerStatus("playing");
          setStreamError("");
        }}
        onWaiting={() => {
          if (!audioRef.current?.paused) {
            setPlayerStatus("loading");
          }
        }}
        onStalled={() => {
          if (!audioRef.current?.paused) {
            setPlayerStatus("loading");
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          setPlayerStatus((current) =>
            current === "error" ? current : "paused",
          );
        }}
        onEnded={() => {
          setIsPlaying(false);
          setPlayerStatus("paused");
        }}
        onError={() => {
          setIsPlaying(false);
          setPlayerStatus("error");
          setStreamError(
            "KLCP is not responding. Please try again in a moment.",
          );
        }}
      />

      <div className="grid items-center gap-4 sm:grid-cols-[172px_1fr]">
        <button
          type="button"
          onClick={togglePlayback}
          className="group relative mx-auto aspect-square w-full max-w-[172px] cursor-pointer overflow-hidden rounded-[8px] bg-white shadow-lg transition hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:max-w-none"
          aria-label={`${playbackLabel}: ${nowPlaying.title}`}
          aria-pressed={isPlaying}
        >
          {hasTrackArtwork ? (
            <Image
              src={nowPlaying.artworkUrl ?? ""}
              alt={`Artwork for ${nowPlaying.title}`}
              fill
              className="object-cover"
              sizes="172px"
              onError={() => setArtworkFailed(true)}
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
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/15 group-hover:opacity-100 group-focus-visible:bg-black/20 group-focus-visible:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              {isPlaying ? (
                <Pause className="h-7 w-7" fill="currentColor" />
              ) : (
                <Play className="ml-1 h-7 w-7" fill="currentColor" />
              )}
            </span>
          </span>
        </button>

        <div className="min-w-0">
          <p className="mb-2 text-sm font-black uppercase text-orange-500">
            Now Playing
          </p>
          <h3 className="text-xl font-black leading-tight text-white">
            {nowPlaying.title}
          </h3>
          <p className="mt-1 text-base text-white/80">{nowPlaying.subtitle}</p>

          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/90 text-white transition hover:bg-white/10"
              aria-label={playbackLabel}
              aria-pressed={isPlaying}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" fill="currentColor" />
              ) : (
                <Play className="ml-1 h-7 w-7" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              className="min-w-0 cursor-pointer rounded-[6px] transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label={playbackLabel}
              aria-pressed={isPlaying}
            >
              <Waveform />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={playerStatus === "loading"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-400 text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:opacity-70"
            aria-label={playbackLabel}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
            )}
          </button>

          <div className="min-w-0 flex-1" aria-live="polite">
            <div className="flex min-h-5 items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  playerStatus === "playing" &&
                    "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]",
                  playerStatus === "loading" && "animate-pulse bg-sky-400",
                  (playerStatus === "idle" || playerStatus === "paused") &&
                    "bg-white/45",
                  playerStatus === "error" && "bg-orange-500",
                )}
              />
              <span className="text-sm font-bold text-white">{statusText}</span>
              {playerStatus === "playing" && (
                <span className="rounded-full border border-red-400/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-200">
                  Live
                </span>
              )}
            </div>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
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

            {streamError && (
              <p className="mt-1 text-xs text-orange-200">{streamError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MorningBuzzArtwork() {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <div className="relative mx-auto flex aspect-[6/5] h-full w-full overflow-hidden rounded-[8px] border border-white/10 bg-[#180b16] shadow-2xl shadow-black/35">
      {imageAvailable ? (
        <Image
          src="/images/morning-buzz-media-card-6x5.png"
          alt="The Morning BUZZ with Teeroy and Michael J"
          width={1500}
          height={1250}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImageAvailable(false)}
        />
      ) : (
        <div className="relative flex min-h-[330px] w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(255,182,42,0.45),transparent_38%),linear-gradient(150deg,#fff7e6_0%,#f8a900_42%,#111_43%,#050505_100%)] p-8 text-center">
          <div className="absolute top-10 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-yellow-300/80" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-black/85" />
          <div className="relative">
            <p className="text-xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)]">
              THE
            </p>
            <p className="text-5xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.85)] sm:text-7xl">
              MORNING
            </p>
            <p className="text-6xl font-black text-orange-400 drop-shadow-[0_5px_0_rgba(0,0,0,0.9)] sm:text-8xl">
              BUZZ
            </p>
            <p className="mt-3 text-lg font-black uppercase text-yellow-300">
              with Teeroy &amp; Michael J
            </p>
            <p className="mt-2 text-sm font-bold uppercase text-white">
              KLCP Phoenix 96.5 FM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CityPinMarker() {
  const id = useId().replace(/:/g, "");
  const gradientId = `city-pin-gradient-${id}`;
  const filterId = `city-pin-shadow-${id}`;

  return (
    <span
      aria-hidden="true"
      className="relative flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <span className="absolute bottom-0 h-2 w-4 rounded-full bg-black/70 blur-[2px]" />
      <svg
        viewBox="0 0 32 40"
        className="relative h-7 w-6 overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            x2="25"
            y1="5"
            y2="31"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="0.45" stopColor="#ff7a1a" />
            <stop offset="1" stopColor="#ef4e00" />
          </linearGradient>
          <filter
            id={filterId}
            x="-35%"
            y="-20%"
            width="170%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="2.6"
              floodColor="#f97316"
              floodOpacity="0.3"
            />
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="3"
              floodColor="#000000"
              floodOpacity="0.45"
            />
          </filter>
        </defs>
        <path
          d="M16 2.25C8.66 2.25 2.75 8.2 2.75 15.58c0 9.55 13.25 22.17 13.25 22.17s13.25-12.62 13.25-22.17C29.25 8.2 23.34 2.25 16 2.25Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
        />
        <path
          d="M8.2 14.9C8.2 9.86 12.28 5.8 17.12 5.8c3.9 0 6.42 2.08 7.86 4.66C22.98 7.38 19.78 5 16 5 10.44 5 6.45 9.52 6.45 14.96c0 3.08 1.48 6.18 3.28 8.86-1.86-3.44-1.53-5.9-1.53-8.92Z"
          fill="#fff7df"
          opacity="0.28"
        />
        <circle
          cx="16"
          cy="15.3"
          r="5.6"
          fill="#111111"
          stroke="#fff1d6"
          strokeOpacity="0.9"
          strokeWidth="1.7"
        />
        <circle cx="13.9" cy="13.1" r="1.15" fill="#ffffff" opacity="0.72" />
      </svg>
    </span>
  );
}

// Tabler's MIT-licensed cactus glyph stays readable at section-title size.
function CactusTitleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5 shrink-0 text-orange-500", className)}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M6 9v1a3 3 0 0 0 3 3h1" />
      <path d="M18 8v5a3 3 0 0 1-3 3h-1" />
      <path d="M10 21V5a2 2 0 1 1 4 0v16" />
      <path d="M7 21h10" />
    </svg>
  );
}

function CityColumn({
  cities,
  withDivider,
}: {
  cities: string[];
  withDivider: boolean;
}) {
  return (
    <ul
      className={cn(
        "space-y-4 px-2 sm:px-5",
        withDivider && "md:border-l md:border-white/25",
      )}
    >
      {cities.map((city) => (
        <li
          key={city}
          className="flex min-h-8 items-center gap-3 text-base font-medium text-white"
        >
          <CityPinMarker />
          <span>{city}</span>
        </li>
      ))}
    </ul>
  );
}

export function HomeLiveLocalMedia() {
  return (
    <section className="relative z-10 bg-[#101010] text-white">
      <div className="border-y border-white/10 bg-[linear-gradient(180deg,#171717_0%,#0c0c0c_100%)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3 text-orange-500">
            <RadioTower className="h-5 w-5" />
            <h2 className="text-center text-2xl font-black uppercase text-white sm:text-3xl">
              Live Local Media
            </h2>
            <RadioTower className="h-5 w-5" />
          </div>

          <div className="grid justify-center gap-6 lg:grid-cols-[minmax(420px,540px)_minmax(420px,540px)] lg:items-stretch">
            <div className="flex aspect-[6/5] h-full w-full flex-col justify-between rounded-[8px] border border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] p-5 shadow-2xl shadow-black/35 sm:p-6">
              <div className="relative mb-6 flex justify-center pt-12 text-center sm:pt-0">
                <span className="absolute left-0 top-0 rounded-[4px] border border-white/70 px-2 py-1 text-sm font-bold uppercase text-white">
                  On Air
                </span>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <Radio className="h-5 w-5 text-orange-500" />
                    <p className="text-3xl font-black uppercase italic text-white">
                      KLCP <span className="text-orange-500">Radio</span>
                    </p>
                  </div>
                  <p className="text-2xl font-black">96.5 FM</p>
                  <p className="text-base text-white/80">
                    The Soundtrack of the Phoenix Metro
                  </p>
                </div>
              </div>

              <RadioCoPlayer />

              <p className="mt-3 text-center text-sm font-medium text-white/80">
                Powered by{" "}
                <span className="font-black text-orange-500">KLCP</span> 96.5 FM
              </p>
            </div>

            <MorningBuzzArtwork />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden border-b border-white/10 bg-[#090909] px-4 py-9 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.82)_70%,#000_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-55">
          <div className="absolute bottom-0 left-[3%] h-16 w-14 rounded-t-[28px] bg-black" />
          <div className="absolute bottom-0 left-[8%] h-24 w-8 rounded-t-[22px] bg-black" />
          <div className="absolute bottom-0 left-[16%] h-20 w-16 rounded-t-[28px] bg-black" />
          <div className="absolute bottom-0 left-[28%] h-28 w-28 rounded-t-[30px] bg-black" />
          <div className="absolute bottom-0 left-[43%] h-32 w-24 rounded-t-[24px] bg-black" />
          <div className="absolute bottom-0 left-[55%] h-20 w-36 rounded-t-[28px] bg-black" />
          <div className="absolute bottom-0 left-[70%] h-28 w-24 rounded-t-[28px] bg-black" />
          <div className="absolute bottom-0 right-[6%] h-24 w-10 rounded-t-[22px] bg-black" />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-8 hidden h-28 w-20 sm:block">
          <div className="absolute bottom-0 left-8 h-28 w-4 rounded-full bg-black" />
          <div className="absolute bottom-14 left-0 h-4 w-10 rounded-full bg-black" />
          <div className="absolute bottom-10 left-0 h-11 w-4 rounded-full bg-black" />
          <div className="absolute bottom-12 right-0 h-4 w-10 rounded-full bg-black" />
          <div className="absolute bottom-12 right-0 h-12 w-4 rounded-full bg-black" />
        </div>
        <div className="pointer-events-none absolute right-8 bottom-0 hidden h-28 w-20 sm:block">
          <div className="absolute bottom-0 left-8 h-28 w-4 rounded-full bg-black" />
          <div className="absolute bottom-12 left-0 h-4 w-10 rounded-full bg-black" />
          <div className="absolute bottom-12 left-0 h-12 w-4 rounded-full bg-black" />
          <div className="absolute right-0 bottom-14 h-4 w-10 rounded-full bg-black" />
          <div className="absolute right-0 bottom-10 h-11 w-4 rounded-full bg-black" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <CactusTitleIcon />
            <h2 className="text-center text-2xl font-black uppercase sm:text-3xl">
              Explore the <span className="text-orange-500">Phoenix Metro</span>
            </h2>
            <CactusTitleIcon />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-0">
            {cityColumns.map((cities, index) => (
              <CityColumn
                key={cities[0]}
                cities={cities}
                withDivider={index > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
