"use client";

import { Pause, Play } from "lucide-react";
import { useRadioPlayback } from "@/components/radio-playback-provider";
import { Button } from "@/components/ui/button";
import type { NowPlayingTrack } from "@/lib/radio";
import { cn } from "@/lib/utils";

type RadioPlayerButtonVariant = "header" | "sidebar" | "sidebar-collapsed";

interface RadioPlayerButtonProps {
  className?: string;
  variant?: RadioPlayerButtonVariant;
}

const programTextSeparator = " - ";
const programTextLimitByVariant: Record<RadioPlayerButtonVariant, number> = {
  header: 30,
  sidebar: 24,
  "sidebar-collapsed": 30,
};

function normalizeProgramText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateProgramText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getProgramTitle(track: NowPlayingTrack) {
  return normalizeProgramText(track.title);
}

function getProgramSubtitle(track: NowPlayingTrack) {
  const subtitle = normalizeProgramText(track.subtitle);
  return subtitle && subtitle !== track.title ? subtitle : "";
}

function getProgramDisplay(
  track: NowPlayingTrack,
  variant: RadioPlayerButtonVariant,
) {
  const maxLength = programTextLimitByVariant[variant];
  const fullTitle = getProgramTitle(track);
  const subtitle = getProgramSubtitle(track);
  const fullText = [fullTitle, subtitle]
    .filter(Boolean)
    .join(programTextSeparator);

  if (fullTitle.length >= maxLength) {
    return {
      fullText,
      title: truncateProgramText(fullTitle, maxLength),
      subtitle: "",
    };
  }

  const subtitleCharacterLimit =
    maxLength - fullTitle.length - programTextSeparator.length;

  return {
    fullText,
    title: fullTitle,
    subtitle:
      subtitle && subtitleCharacterLimit > 0
        ? truncateProgramText(subtitle, subtitleCharacterLimit)
        : "",
  };
}

export function RadioPlayerButton({
  className,
  variant = "header",
}: RadioPlayerButtonProps) {
  const { isPlaying, nowPlaying, playerStatus, togglePlayback } =
    useRadioPlayback();

  const isLoading = playerStatus === "loading";
  const shouldStop = isLoading || isPlaying;
  const programDisplay = getProgramDisplay(nowPlaying, variant);
  const playerLabel = `${shouldStop ? "Pause" : "Play"} ${
    programDisplay.fullText
  }`;
  const isSidebar = variant !== "header";
  const isCollapsed = variant === "sidebar-collapsed";

  if (isCollapsed) {
    return (
      <Button
        type="button"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-md border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground shadow-sm hover:bg-sidebar-accent",
          className,
        )}
        onClick={togglePlayback}
        aria-label={playerLabel}
        aria-pressed={isPlaying}
        title={playerLabel}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_18px_rgba(239,68,68,0.28)]",
            shouldStop && "animate-pulse",
          )}
          aria-hidden="true"
        >
          {shouldStop ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
          )}
        </span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={cn(
        className,
        variant === "header"
          ? "h-12 overflow-hidden rounded-[18px] border-sky-100/20 bg-[#12334b]/72 px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur transition-[width,background-color,border-color] duration-200 hover:bg-[#163b56]/78 sm:px-3"
          : "h-12 w-full overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-2.5 text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent",
        variant === "header"
          ? "w-fit min-w-[112px] max-w-[112px] justify-start gap-2 min-[360px]:min-w-[128px] min-[360px]:max-w-[128px] min-[420px]:min-w-[144px] min-[420px]:max-w-[144px] sm:min-w-[206px] sm:max-w-[206px] md:max-w-[352px]"
          : "justify-start gap-2",
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
          <span
            className={cn(
              "min-w-0 truncate font-bold",
              isSidebar ? "text-sidebar-foreground" : "text-white",
            )}
          >
            {programDisplay.title}
          </span>
          {programDisplay.subtitle && (
            <>
              <span
                className={cn(
                  "hidden shrink-0 font-bold md:inline",
                  isSidebar ? "text-sidebar-foreground/35" : "text-white/35",
                )}
              >
                -
              </span>
              <span
                className={cn(
                  "hidden min-w-0 truncate text-[11px] font-bold md:inline xl:text-[12px]",
                  isSidebar ? "text-sidebar-foreground/60" : "text-white/58",
                )}
              >
                {programDisplay.subtitle}
              </span>
            </>
          )}
        </span>
        <span
          className={cn(
            "flex w-full max-w-full items-center gap-1.5 text-[10px] font-bold leading-none sm:text-[12px]",
            isSidebar ? "text-sidebar-foreground/75" : "text-white/76",
          )}
        >
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
