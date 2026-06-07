"use client";

import {
  CheckCircle2,
  CircleDashed,
  Download,
  ExternalLink,
  FileAudio,
  Globe2,
  LockKeyhole,
  type LucideIcon,
  Mic2,
  Music2,
  RadioTower,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudioMode = "merchant" | "admin";

interface OnAirStudioContentProps {
  mode?: StudioMode;
  merchantName?: string | null;
  publicPageHref?: string | null;
  backHref?: string;
}

type StatusTone = "active" | "ready" | "waiting";
type DeliverableType = "audio" | "proof";

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
    title: "Radio spot",
    status: "In production",
    statusTone: "active",
    description: "Final produced ad for KLCP 96.5 FM.",
    icon: Mic2,
    type: "audio",
    uploadTitle: "Radio spot audio",
    uploadHint: "Upload the approved MP3 or WAV.",
    audioSrc: null,
  },
  {
    key: "soundtrack",
    title: "Signature soundtrack",
    status: "In production",
    statusTone: "active",
    description: "Custom music bed for the merchant campaign.",
    icon: Music2,
    uploadTitle: "Signature soundtrack audio",
    uploadHint: "Upload the final MP3 or WAV.",
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
    title: "Signature soundtrack",
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

function AudioPlayer({
  audioSrc,
  title,
}: {
  audioSrc?: string | null;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <audio
        aria-label={`${title} player`}
        className="h-10 w-full min-w-0"
        controls
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
            ? "Ready to play in this dashboard."
            : "Player ready. Final audio has not been uploaded yet."}
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
      Download
    </Button>
  );
}

function MerchantServicesOverview({
  displayName,
  publicPageHref,
}: {
  displayName: string;
  publicPageHref?: string | null;
}) {
  const audioServices = merchantServices.filter(
    (service) => service.hasPreview,
  );
  const visibilityServices = merchantServices.filter(
    (service) => !service.hasPreview,
  );
  const getVisibilityAssetLink = (serviceKey: string) => {
    if (serviceKey === "public-page") {
      return {
        href: publicPageHref || null,
        label: "Open public page",
      };
    }

    if (serviceKey === "category-reservation") {
      return {
        href: "/merchant/profile",
        label: "View reservation",
      };
    }

    return null;
  };

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
              Overview of the services included in your Local City Places media
              package.
            </p>
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
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4">
              Services overview
            </Badge>
            <h2 className="max-w-2xl text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              Local City Places package for {displayName}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your package combines audio production, a public merchant page,
              category positioning, and KLCP 96.5 FM airplay into one local
              media program.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border-l-2 border-primary/70 pl-3">
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs leading-4 text-muted-foreground">
                included services
              </p>
            </div>
            <div className="border-l-2 border-primary/70 pl-3">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs leading-4 text-muted-foreground">
                audio assets
              </p>
            </div>
            <div className="border-l-2 border-success/70 pl-3">
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs leading-4 text-muted-foreground">
                public page
              </p>
            </div>
          </div>
        </div>

        <div className="grid border-t lg:grid-cols-[1fr_0.9fr] lg:divide-x">
          <div className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Audio services</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These are the files you will be able to preview and download
                when production is complete.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {audioServices.map((service) => {
                const Icon = service.icon;

                return (
                  <article
                    key={service.key}
                    className="flex min-h-[248px] flex-col rounded-lg border bg-background/40 p-4"
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
                    <p className="text-xs font-medium text-muted-foreground">
                      {service.category}
                    </p>
                    <h3 className="mt-1 font-semibold">{service.title}</h3>
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

          <div className="border-t lg:border-t-0">
            <div className="border-b p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Visibility services</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The public-facing pieces that support the audio campaign.
              </p>
            </div>

            <div className="divide-y">
              {visibilityServices.map((service) => {
                const Icon = service.icon;
                const assetLink = getVisibilityAssetLink(service.key);

                return (
                  <article key={service.key} className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {service.category}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold">
                            {service.title}
                          </h3>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <StudioStatusBadge
                        status={service.status}
                        tone={service.statusTone}
                      />
                    </div>

                    {assetLink?.href ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-4"
                      >
                        <Link href={assetLink.href}>
                          <ExternalLink className="h-4 w-4" />
                          {assetLink.label}
                        </Link>
                      </Button>
                    ) : assetLink ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="mt-4"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {assetLink.label}
                      </Button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mic2 className="h-4 w-4" />
          </div>
          <h2 className="font-semibold">1. Produce</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Local City Places produces the spot and soundtrack for your
            business.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Globe2 className="h-4 w-4" />
          </div>
          <h2 className="font-semibold">2. Publish</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your public merchant page and category reservation support the
            campaign online.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <RadioTower className="h-4 w-4" />
          </div>
          <h2 className="font-semibold">3. Play</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Approved audio moves into KLCP scheduling, with confirmation added
            here.
          </p>
        </div>
      </section>
    </div>
  );
}

export function OnAirStudioContent({
  mode = "merchant",
  merchantName,
  publicPageHref,
  backHref,
}: OnAirStudioContentProps) {
  const isAdmin = mode === "admin";
  const displayName = merchantName || "your business";

  if (!isAdmin) {
    return (
      <MerchantServicesOverview
        displayName={displayName}
        publicPageHref={publicPageHref}
      />
    );
  }

  const audioDeliverables = deliverables.filter(
    (item) => item.type === "audio",
  );
  const proofDeliverables = deliverables.filter(
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
              <p className="text-2xl font-bold">2</p>
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
          {deliverables.map((item) => {
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
            {deliverables.map((item) => {
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
                  <Button variant="outline" size="sm" disabled>
                    <UploadCloud className="h-4 w-4" />
                    Upload
                  </Button>
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
