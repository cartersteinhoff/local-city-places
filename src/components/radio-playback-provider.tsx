"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fallbackNowPlaying,
  type NowPlayingTrack,
  normalizeNowPlaying,
  type RadioTrackApiResponse,
  radioStreamUrl,
  radioTrackApiUrl,
} from "@/lib/radio";

const metadataFallbackRefreshMs = 15_000;

type RadioPlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

type RadioPlaybackContextValue = {
  isPlaying: boolean;
  nowPlaying: NowPlayingTrack;
  playerStatus: RadioPlayerStatus;
  streamError: string;
  togglePlayback: () => void;
};

const RadioPlaybackContext = createContext<RadioPlaybackContextValue | null>(
  null,
);

export function RadioPlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<RadioPlayerStatus>("idle");
  const [nowPlaying, setNowPlaying] = useState(fallbackNowPlaying);
  const [streamError, setStreamError] = useState("");

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
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    refreshNowPlaying();
    const intervalId = window.setInterval(
      refreshNowPlaying,
      metadataFallbackRefreshMs,
    );

    return () => {
      isMounted = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  async function startRadio() {
    const audio = audioRef.current;
    if (!audio) return;

    setPlayerStatus("loading");

    try {
      setStreamError("");
      audio.muted = false;
      audio.volume = 1;
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

  function pauseRadio() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    setPlayerStatus("paused");
  }

  function togglePlayback() {
    if (playerStatus === "loading" || isPlaying) {
      pauseRadio();
      return;
    }

    startRadio();
  }

  return (
    <RadioPlaybackContext.Provider
      value={{
        isPlaying,
        nowPlaying,
        playerStatus,
        streamError,
        togglePlayback,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src={radioStreamUrl}
        preload="none"
        playsInline
        muted={false}
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
    </RadioPlaybackContext.Provider>
  );
}

export function useRadioPlayback() {
  const context = useContext(RadioPlaybackContext);
  if (!context) {
    throw new Error(
      "useRadioPlayback must be used within RadioPlaybackProvider",
    );
  }

  return context;
}
