"use client";

import { ChevronDown, Pause, Play, Store, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRadioPlayback } from "@/components/radio-playback-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NowPlayingTrack } from "@/lib/radio";
import { cn } from "@/lib/utils";

type HomeHeaderVariant = "white" | "transparent";

interface HomeHeaderProps {
  variant?: HomeHeaderVariant;
}

const headerVariants = {
  white: {
    bar: "border-b border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] shadow-sm",
    radio:
      "border border-sky-200/25 bg-white/10 px-3 font-semibold text-white shadow-sm hover:bg-white/15 sm:px-4",
    login:
      "bg-orange-500 px-3 font-semibold text-white shadow-sm hover:bg-orange-600 sm:px-6",
  },
  transparent: {
    bar: "border-b border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] shadow-sm",
    radio:
      "border border-sky-200/25 bg-white/10 px-3 font-semibold text-white shadow-sm hover:bg-white/15 sm:px-4",
    login:
      "bg-orange-500 px-3 font-semibold text-white shadow-sm hover:bg-orange-600 sm:px-6",
  },
} as const;

const loginMenuItemClass =
  "group h-10 cursor-pointer rounded-[12px] px-2.5 py-0 text-[14px] font-semibold text-white/95 transition-colors focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white";

const loginMenuIconClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-orange-300 transition-colors group-focus:bg-orange-500 group-focus:text-white group-data-[highlighted]:bg-orange-500 group-data-[highlighted]:text-white";

const headerProgramTextLimit = 30;
const headerProgramTextSeparator = " - ";

function normalizeHeaderProgramText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateHeaderProgramText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getHeaderProgramTitle(track: NowPlayingTrack) {
  return normalizeHeaderProgramText(track.title);
}

function getHeaderProgramSubtitle(track: NowPlayingTrack) {
  const subtitle = normalizeHeaderProgramText(track.subtitle);
  return subtitle && subtitle !== track.title ? subtitle : "";
}

function getHeaderProgramDisplay(track: NowPlayingTrack) {
  const fullTitle = getHeaderProgramTitle(track);
  const subtitle = getHeaderProgramSubtitle(track);
  const fullText = [fullTitle, subtitle]
    .filter(Boolean)
    .join(headerProgramTextSeparator);

  if (fullTitle.length >= headerProgramTextLimit) {
    return {
      fullText,
      title: truncateHeaderProgramText(fullTitle, headerProgramTextLimit),
      subtitle: "",
    };
  }

  const subtitleCharacterLimit =
    headerProgramTextLimit -
    fullTitle.length -
    headerProgramTextSeparator.length;

  return {
    fullText,
    title: fullTitle,
    subtitle:
      subtitle && subtitleCharacterLimit > 0
        ? truncateHeaderProgramText(subtitle, subtitleCharacterLimit)
        : "",
  };
}

function HeaderRadioPlayer({ className }: { className: string }) {
  const { isPlaying, nowPlaying, playerStatus, togglePlayback } =
    useRadioPlayback();

  const isLoading = playerStatus === "loading";
  const shouldStop = isLoading || isPlaying;
  const programDisplay = getHeaderProgramDisplay(nowPlaying);
  const playerLabel = `${shouldStop ? "Pause" : "Play"} ${
    programDisplay.fullText
  }`;

  return (
    <Button
      type="button"
      size="sm"
      className={cn(
        className,
        "h-12 overflow-hidden rounded-[18px] border-sky-100/20 bg-[#12334b]/72 px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur transition-[background-color,border-color] duration-200 hover:bg-[#163b56]/78 sm:px-3",
        "w-[154px] justify-start gap-2 sm:w-[206px] md:w-[352px]",
      )}
      style={{
        display: "inline-flex",
        height: "3rem",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.5rem",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
      onClick={togglePlayback}
      aria-label={playerLabel}
      aria-pressed={isPlaying}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_18px_rgba(239,68,68,0.28)] transition-transform duration-200 hover:scale-[1.03] sm:h-8 sm:w-8",
        )}
        style={{
          display: "flex",
          width: "1.75rem",
          height: "1.75rem",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
        }}
        aria-hidden="true"
      >
        {shouldStop ? (
          <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" />
        ) : (
          <Play
            className="ml-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4"
            fill="currentColor"
          />
        )}
      </span>
      <span
        className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 text-left md:flex-none"
        style={{
          display: "flex",
          minWidth: 0,
          flex: "1 1 auto",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "0.25rem",
          textAlign: "left",
        }}
      >
        <span className="flex w-full max-w-full min-w-0 items-baseline gap-1.5 text-[12px] leading-none sm:text-[15px]">
          <span className="min-w-0 truncate font-bold text-white">
            {programDisplay.title}
          </span>
          {programDisplay.subtitle && (
            <>
              <span className="hidden shrink-0 font-bold text-white/35 md:inline">
                -
              </span>
              <span className="hidden min-w-0 truncate text-[11px] font-bold text-white/58 md:inline xl:text-[12px]">
                {programDisplay.subtitle}
              </span>
            </>
          )}
        </span>
        <span className="flex w-full max-w-full items-center gap-1.5 text-[10px] font-bold leading-none text-white/76 sm:text-[12px]">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]",
              shouldStop && "animate-pulse",
            )}
            aria-hidden="true"
          />
          <span className="truncate">
            KLCP 96.5 FM -{" "}
            <span className="font-black text-red-400">On Air</span>
          </span>
        </span>
      </span>
    </Button>
  );
}

export function HomeHeader({ variant = "white" }: HomeHeaderProps) {
  const styles = headerVariants[variant];

  return (
    <header
      className="relative z-10"
      style={{ position: "relative", zIndex: 10 }}
    >
      <div className={styles.bar}>
        <div
          className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
          style={{
            position: "relative",
            display: "flex",
            maxWidth: "80rem",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginRight: "auto",
            marginLeft: "auto",
            padding: "0.75rem clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          <Link
            href="/"
            aria-label="Go to homepage"
            style={{ display: "inline-flex", flexShrink: 0 }}
          >
            <Image
              src="/images/local-city-places-header-logo-v12.webp"
              alt="Local City Places"
              width={161}
              height={72}
              style={{ width: "clamp(125px, 33.5vw, 161px)", height: "auto" }}
              priority
            />
          </Link>

          <div
            className="flex items-center gap-2"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div>
              <HeaderRadioPlayer className={styles.radio} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    styles.login,
                    "group h-12 rounded-[18px] px-3 text-base transition-[background-color,box-shadow] data-[state=open]:bg-orange-600 data-[state=open]:shadow-[0_14px_28px_rgba(249,115,22,0.3)] sm:px-6",
                  )}
                  style={{
                    display: "inline-flex",
                    height: "3rem",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Login
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-[168px] rounded-[16px] border border-white/15 bg-[#06243d]/95 p-1.5 text-white shadow-[0_18px_45px_rgba(1,19,31,0.38)] backdrop-blur-xl"
              >
                <DropdownMenuItem asChild className={loginMenuItemClass}>
                  <Link href="/member-login">
                    <span className={loginMenuIconClass}>
                      <User className="h-4 w-4 text-current" />
                    </span>
                    Member
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={loginMenuItemClass}>
                  <Link href="/merchant-login">
                    <span className={loginMenuIconClass}>
                      <Store className="h-4 w-4 text-current" />
                    </span>
                    Merchant
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
