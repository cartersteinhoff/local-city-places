"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe2,
  Loader2,
  LockKeyhole,
  type LucideIcon,
  Mailbox,
  Megaphone,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { merchantNavItems } from "../nav";

interface MerchantSummary {
  businessName: string;
  categoryName: string | null;
  city: string | null;
  state: string | null;
}

interface MarketLockDashboardData {
  merchant: MerchantSummary;
}

type StepTone = "current" | "target" | "addon";

const reachTools: Array<{
  title: string;
  detail: string;
  status: string;
  icon: LucideIcon;
}> = [
  {
    title: "Category lock",
    detail: "Exclusive local category position in the selected city.",
    status: "Active",
    icon: ShieldCheck,
  },
  {
    title: "Merchant page",
    detail: "Customer-facing Local City Places page for the campaign.",
    status: "Active",
    icon: Globe2,
  },
  {
    title: "KLCP media",
    detail: "Radio spot, interview, soundtrack, and airplay support.",
    status: "In production",
    icon: RadioTower,
  },
  {
    title: "Direct mail",
    detail: "Local household reach tied to the protected market.",
    status: "MarketLock360",
    icon: Mailbox,
  },
  {
    title: "Sweepstakes traffic",
    detail: "Member nominations, referrals, and campaign engagement.",
    status: "MarketLock360",
    icon: Sparkles,
  },
  {
    title: "Google profile support",
    detail: "Maps visibility, reviews, and local search signals.",
    status: "Dominator",
    icon: Search,
  },
];

const upgradePath: Array<{
  level: string;
  label: string;
  title: string;
  detail: string;
  status: string;
  tone: StepTone;
  icon: LucideIcon;
}> = [
  {
    level: "Level 1",
    label: "Current position",
    title: "City + category reserved",
    detail: "The merchant owns the selected category in this local market.",
    status: "Active",
    tone: "current",
    icon: ShieldCheck,
  },
  {
    level: "Level 2",
    label: "Recommended next step",
    title: "MarketLock360",
    detail: "Adds media, mail, sweepstakes traffic, and local growth support.",
    status: "Add reach",
    tone: "target",
    icon: LockKeyhole,
  },
  {
    level: "Level 3",
    label: "Pro upgrade",
    title: "LOCAL AI Staff",
    detail: "Follow-up, appointments, and communication support.",
    status: "Add-on",
    tone: "addon",
    icon: Bot,
  },
  {
    level: "Level 4",
    label: "Dominator upgrade",
    title: "Google profile support",
    detail: "Maps visibility, reviews, and local search signals.",
    status: "Add-on",
    tone: "addon",
    icon: Globe2,
  },
];

const statusClasses = {
  Active:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "In production":
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  MarketLock360:
    "border-primary/35 bg-primary/10 text-primary dark:text-orange-300",
  Dominator:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
} as const;

const toneClasses = {
  current: {
    card: "border-emerald-500/45 bg-emerald-500/10",
    number:
      "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    status:
      "border-emerald-500/40 bg-background text-emerald-700 dark:text-emerald-300",
  },
  target: {
    card: "border-primary/60 bg-primary/10 ring-1 ring-primary/20",
    number: "border-primary/50 bg-primary/15 text-primary",
    icon: "bg-primary/15 text-primary",
    status: "border-primary/40 bg-background text-primary",
  },
  addon: {
    card: "border-border bg-background/70",
    number: "border-border bg-muted/40 text-muted-foreground",
    icon: "bg-muted text-primary",
    status: "border-border bg-background text-muted-foreground",
  },
} satisfies Record<
  StepTone,
  { card: string; number: string; icon: string; status: string }
>;

function MarketLockStatusBadge({
  status,
}: {
  status: keyof typeof statusClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
}

export default function MerchantMarketLock360Page() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [data, setData] = useState<MarketLockDashboardData | null>(null);
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
        .then((responseData) => {
          if (!responseData.error) {
            setData({ merchant: responseData.merchant });
          }
        })
        .catch((error) => {
          console.error("Failed to load MarketLock360 data:", error);
        })
        .finally(() => setDataLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const merchant = data?.merchant;
  const categoryName = merchant?.categoryName || "Selected category";
  const marketLabel =
    [merchant?.city, merchant?.state].filter(Boolean).join(", ") ||
    "Selected market";
  const lockLabel = `${categoryName} in ${marketLabel}`;
  const activationHref = useMemo(() => {
    const subject = encodeURIComponent(
      `MarketLock360 activation for ${merchant?.businessName || "my business"}`,
    );
    const body = encodeURIComponent(
      `I want to add MarketLock360 reach to ${lockLabel}.`,
    );

    return `mailto:hello@localcityplaces.com?subject=${subject}&body=${body}`;
  }, [lockLabel, merchant?.businessName]);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="MarketLock360"
            description="Add media, mail, sweepstakes, and growth support to your reserved market."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/merchant">
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild>
                  <a href={activationHref}>
                    <Megaphone className="h-4 w-4" />
                    Request activation
                  </a>
                </Button>
              </div>
            }
          />

          <section className="mb-6 overflow-hidden rounded-xl border bg-card">
            <div className="grid 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
              <div className="p-5 md:p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Locked position
                </p>
                <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                  Add MarketLock360 reach to {lockLabel}.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Your city and category are the anchor. MarketLock360 turns
                  that protected position into a larger campaign with KLCP
                  media, direct mail, sweepstakes activity, and local support.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-1 text-xl font-bold">{categoryName}</p>
                    <div className="mt-3">
                      <MarketLockStatusBadge status="Active" />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      City
                    </p>
                    <p className="mt-1 text-xl font-bold">{marketLabel}</p>
                    <div className="mt-3">
                      <MarketLockStatusBadge status="Active" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Next step
                    </p>
                    <p className="mt-1 text-xl font-bold">Add reach</p>
                    <div className="mt-3">
                      <MarketLockStatusBadge status="MarketLock360" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t bg-muted/30 p-5 md:p-6 2xl:border-l 2xl:border-t-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  What changes
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  The lock becomes a campaign.
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    "Direct mail reaches local households.",
                    "Sweepstakes creates traffic and referral activity.",
                    "KLCP media supports awareness and credibility.",
                    "Growth upgrades help with follow-up and search signals.",
                  ].map((item) => (
                    <div className="flex gap-3" key={item}>
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-xl border bg-card p-5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Upgrade path
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Build around the reserved market.
                </h2>
              </div>
              <span className="w-fit rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                6 tools in MarketLock360
              </span>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
              {upgradePath.map((step, index) => {
                const Icon = step.icon;
                const tone = toneClasses[step.tone];

                return (
                  <div
                    className={cn(
                      "min-w-0 rounded-lg border p-4 transition-colors",
                      tone.card,
                    )}
                    key={step.title}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                          tone.number,
                        )}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          tone.status,
                        )}
                      >
                        {step.status}
                      </span>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          tone.icon,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {step.level}
                        </p>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {step.label}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-6 overflow-hidden rounded-xl border bg-card">
            <div className="grid 2xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="border-b bg-muted/30 p-5 md:p-6 2xl:border-b-0 2xl:border-r">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  MarketLock360 tools
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Built around {categoryName}.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  These are the pieces that turn the reserved category into a
                  broader market campaign.
                </p>
                <Button className="mt-5" asChild>
                  <a href={activationHref}>
                    Add MarketLock360 reach
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-3">
                {reachTools.map(({ icon: Icon, title, detail, status }) => (
                  <div
                    className="rounded-lg border bg-background/70 p-4"
                    key={title}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <MarketLockStatusBadge
                        status={status as keyof typeof statusClasses}
                      />
                    </div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 md:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Pro upgrade
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                LOCAL AI Staff
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Add follow-up, appointment handling, customer communication, and
                campaign support when the merchant needs more operational help.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 md:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Dominator upgrade
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Google profile support
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Add Maps visibility, review activity, and local search signal
                support around the locked position.
              </p>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
