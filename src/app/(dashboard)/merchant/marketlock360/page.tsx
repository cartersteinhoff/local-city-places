"use client";

import {
  ArrowLeft,
  Loader2,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { CityTerritoryMap } from "@/components/merchant/city-territory-map";
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

          <section className="mb-6 rounded-xl border bg-card p-5 md:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                {`The ${categoryName} spot in ${marketLabel}`}
              </h2>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                One spot per category
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-emerald-500/45 bg-emerald-500/10 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">
                  {merchant?.businessName || "Your business"}
                </p>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Holds this spot &middot; lock active
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                Yours
              </span>
            </div>

            <ul className="mt-2 divide-y">
              {[
                { id: "first", width: "w-32", fade: "opacity-75" },
                { id: "second", width: "w-44", fade: "opacity-60" },
                { id: "third", width: "w-28", fade: "opacity-45" },
              ].map((row) => (
                <li
                  key={row.id}
                  className={cn("flex items-center gap-4 px-4 py-3", row.fade)}
                >
                  <LockKeyhole className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span
                    aria-hidden="true"
                    className={cn("h-2.5 rounded-full bg-muted", row.width)}
                  />
                  <span className="ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Locked out
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {`Every other ${categoryName} business in ${marketLabel} is locked out of this spot while your campaign is active.`}
            </p>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 md:p-6">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Your deed
              </p>
              <div className="mt-4 rounded-lg border p-1.5">
                <div className="rounded-md border border-dashed p-5 md:p-6">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Local City Places
                  </p>
                  <h3 className="mt-1 text-center text-xl font-bold tracking-tight">
                    Certificate of Market Lock
                  </h3>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    This certifies that
                  </p>
                  <p className="mt-1 text-center text-lg font-bold">
                    {merchant?.businessName || "Your business"}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-center text-sm leading-6 text-muted-foreground">
                    {`holds the exclusive ${categoryName} position in ${marketLabel} on Local City Places.`}
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Lock in force</p>
                      <p className="text-xs text-muted-foreground">
                        Effective for the current campaign term
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <p className="text-center text-xs font-semibold uppercase text-muted-foreground">
                      Endorsements
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-2.5 text-center">
                        <p className="text-xs font-semibold text-primary">
                          MarketLock360
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Available now
                        </p>
                      </div>
                      <div className="rounded-md border border-dashed p-2.5 text-center">
                        <p className="text-xs font-semibold text-muted-foreground">
                          LOCAL AI Staff
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          After 360
                        </p>
                      </div>
                      <div className="rounded-md border border-dashed p-2.5 text-center">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Google profile
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          After 360
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 md:p-6">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Your territory
              </p>
              <div className="mt-4">
                <CityTerritoryMap
                  city={merchant?.city}
                  state={merchant?.state}
                  className="h-56 w-full sm:h-64"
                />
                <h3 className="mt-4 text-lg font-semibold">
                  {`Layers around ${marketLabel}`}
                </h3>
                <ul className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-500/20" />
                    <span className="min-w-0 flex-1 text-sm">
                      Category lock
                    </span>
                    <MarketLockStatusBadge status="Active" />
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-blue-500/70 bg-blue-500/15" />
                    <span className="min-w-0 flex-1 text-sm">
                      KLCP airwaves
                    </span>
                    <MarketLockStatusBadge status="In production" />
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/60" />
                    <span className="min-w-0 flex-1 text-sm">
                      Direct mail households
                    </span>
                    <MarketLockStatusBadge status="MarketLock360" />
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                    <span className="min-w-0 flex-1 text-sm">
                      Search &amp; Maps presence
                    </span>
                    <MarketLockStatusBadge status="Dominator" />
                  </li>
                </ul>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  {`The highlighted perimeter marks your locked ${marketLabel} market. MarketLock360 activates the remaining layers inside it.`}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">
                {`Add MarketLock360 reach to ${lockLabel}`}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Direct mail, sweepstakes traffic, and growth support on top of
                your locked position.
              </p>
            </div>
            <Button asChild className="w-fit shrink-0">
              <a href={activationHref}>
                <Megaphone className="h-4 w-4" />
                Request activation
              </a>
            </Button>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
