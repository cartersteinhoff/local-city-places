"use client";

import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";

interface VimeoEmbedProps {
  url: string;
  title?: string;
}

export function VimeoEmbed({ url, title = "Featured Video" }: VimeoEmbedProps) {
  const videoId = extractVimeoId(url);

  if (!videoId) {
    return null;
  }

  const embedUrl = getVimeoEmbedUrl(videoId);

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-lg font-semibold">{title}</h2>
      )}
      <div className="relative w-full overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    </div>
  );
}
