export const radioStreamUrl = "https://s5.radio.co/sabc365e3e/listen";

export const radioTrackApiUrl =
  "https://public.radio.co/api/v2/sabc365e3e/track/current";

export const radioTrackEventsUrl = `https://mercure.radio.co/.well-known/mercure?topic=${encodeURIComponent(
  radioTrackApiUrl,
)}`;

export type RadioTrackApiResponse = {
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

export type NowPlayingTrack = {
  title: string;
  subtitle: string;
  artworkUrl: string | null;
  startTime: string | null;
};

export const fallbackNowPlaying: NowPlayingTrack = {
  title: "KLCP Radio",
  subtitle: "Live from Phoenix 96.5 FM",
  artworkUrl: null,
  startTime: null,
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readableTrackText(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNowPlaying(
  payload: RadioTrackApiResponse,
): NowPlayingTrack | null {
  const track = payload.data;
  if (!track) return null;

  const title = readableTrackText(
    stringValue(track.track_title) ||
      stringValue(track.title) ||
      fallbackNowPlaying.title,
  );
  const artist = readableTrackText(stringValue(track.track_artist));
  const album = readableTrackText(stringValue(track.track_album));
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
