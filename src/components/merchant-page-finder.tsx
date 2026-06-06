"use client";

import { Check, LockKeyhole, Search, Store, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { Footer } from "@/components/footer";
import { HomeHeader } from "@/components/home-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";
import { stripPhoneNumber } from "@/lib/utils";

const trustItems = [
  {
    icon: LockKeyhole,
    title: "Secure",
    text: "Your information is safe with us.",
  },
  {
    icon: UserRound,
    title: "Private",
    text: "Only you can access your Merchant Page.",
  },
  {
    icon: Check,
    title: "Instant Access",
    text: "Quickly find and manage your business page.",
  },
];
const photoStripCopies = ["copy-1", "copy-2", "copy-3"];

function MerchantPageFinderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = stripPhoneNumber(searchParams.get("phone") || "");
  const status = searchParams.get("status");
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperMessage = useMemo(() => {
    if (status === "not-found") {
      return "No merchant page was found for that phone number.";
    }
    if (status === "invalid") {
      return "Enter the 10 digit business phone number for the merchant page.";
    }
    return "";
  }, [status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = stripPhoneNumber(phone);

    if (digits.length !== 10) {
      setError("Enter a 10 digit business phone number.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/merchant-page-lookup?phone=${digits}`);
      const result = (await response.json()) as {
        found?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "We could not check that phone number.");
        return;
      }

      if (!result.found) {
        setError(
          result.error || "No merchant page was found for that phone number.",
        );
        return;
      }

      router.push(`/${digits}`);
    } catch {
      setError("We could not check that phone number. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark relative flex min-h-screen flex-col overflow-hidden bg-[#04131f]">
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <AnimatedFoodBackground />
      </div>
      <HomeHeader />

      <main className="relative z-10 flex flex-1 flex-col px-4 pt-8 sm:px-6 lg:pt-10">
        <div className="relative z-20 mx-auto w-full max-w-3xl">
          <section className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded bg-[#052843] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[3px_4px_0_rgba(0,0,0,0.18)]">
              <Store className="h-4 w-4 text-orange-400" />
              Merchant Access
            </div>

            <h1 className="text-3xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.2)] sm:text-4xl">
              Find Your Merchant Page
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.32)] sm:text-base">
              Enter the 10 digit phone number connected to your business
              listing.
            </p>
          </section>

          <section className="mt-6 rounded-lg border border-sky-200/20 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] p-4 shadow-[0_22px_60px_rgba(2,31,54,0.28)] sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="merchant-phone"
                  className="mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white"
                >
                  Merchant page URL
                </label>
                <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/30 sm:flex-row">
                  <div className="flex min-h-12 items-center border-b border-zinc-200 bg-[#f4f7f8] px-3 text-xs font-bold text-[#052843] sm:shrink-0 sm:border-r sm:border-b-0 sm:text-sm">
                    <span className="break-all sm:break-normal sm:whitespace-nowrap">
                      https://localcityplaces.com/
                    </span>
                  </div>
                  <Input
                    id="merchant-phone"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="10 digit business phone"
                    value={phone}
                    onChange={(event) => {
                      setPhone(stripPhoneNumber(event.target.value));
                      setError("");
                    }}
                    className="h-12 rounded-none border-0 !bg-white px-3 text-base font-black tracking-[0.08em] !text-zinc-950 shadow-none placeholder:text-zinc-500 placeholder:opacity-100 focus-visible:ring-0 dark:!bg-white dark:!text-zinc-950 dark:placeholder:text-zinc-500"
                  />
                </div>
                {(error || helperMessage) && (
                  <p
                    className={[
                      "mt-2 rounded-md px-3 py-2 text-sm font-bold",
                      error || status === "not-found" || status === "invalid"
                        ? "bg-red-50 text-red-800"
                        : "bg-white/10 text-white",
                    ].join(" ")}
                  >
                    {error || helperMessage}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full bg-orange-500 text-base font-black text-white shadow-sm hover:bg-orange-600"
              >
                <Search className="h-4 w-4" />
                {isSubmitting ? "Checking..." : "Find Merchant Page"}
              </Button>
            </form>

            <TrustItemsRow />
          </section>
        </div>

        <MerchantPhotoStrip />
      </main>

      <Footer variant="dark" />
    </div>
  );
}

function TrustItemsRow() {
  return (
    <div className="mt-5 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
      {trustItems.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.title} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-sky-200/70 bg-white/10 text-white">
              <Icon className="h-4 w-4" strokeWidth={2.8} />
            </div>
            <div>
              <p className="text-sm font-black leading-5 text-white">
                {item.title}
              </p>
              <p className="text-xs font-medium leading-5 text-white/80">
                {item.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MerchantPhotoStrip() {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchFeaturedMerchants() {
      try {
        const response = await fetch("/api/featured-merchants");
        if (!response.ok) return;

        const data = (await response.json()) as {
          merchants?: FeaturedMerchant[];
        };

        if (isMounted) {
          setMerchants(data.merchants || []);
        }
      } catch (error) {
        console.error("Error fetching featured merchants:", error);
      }
    }

    fetchFeaturedMerchants();

    return () => {
      isMounted = false;
    };
  }, []);

  const imageMerchants = merchants
    .filter((merchant) => merchant.imageUrl || merchant.logoUrl)
    .slice(0, 14);

  if (imageMerchants.length === 0) {
    return <div className="mt-auto h-32 sm:h-44" aria-hidden="true" />;
  }

  const stripItems = photoStripCopies.flatMap((copyId) =>
    imageMerchants.map((merchant) => ({
      merchant,
      itemKey: `${copyId}-${merchant.id}`,
    })),
  );

  return (
    <section
      aria-hidden="true"
      className="pointer-events-none relative left-1/2 z-0 mt-auto w-screen -translate-x-1/2 pt-6"
    >
      <div className="relative h-40 overflow-hidden sm:h-52 lg:h-60">
        <div
          className="absolute bottom-0 left-0 flex min-w-max animate-marquee-left gap-3 px-3 motion-reduce:animate-none"
          style={{ animationDuration: "125s" }}
        >
          {stripItems.map(({ merchant, itemKey }) => {
            const imageUrl = merchant.imageUrl || merchant.logoUrl;
            if (!imageUrl) return null;
            const location =
              merchant.city && merchant.state
                ? `${merchant.city}, ${merchant.state}`
                : merchant.city || merchant.state;

            return (
              <div
                key={itemKey}
                className="relative h-36 w-64 shrink-0 overflow-hidden rounded-t-lg bg-[#052843] shadow-[0_12px_34px_rgba(3,31,53,0.25)] ring-1 ring-white/25 sm:h-48 sm:w-80 lg:h-56 lg:w-[420px]"
              >
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 256px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#021f36]/86 via-[#021f36]/24 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <p className="truncate text-sm font-black leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] sm:text-base">
                    {merchant.businessName}
                  </p>
                  {location && (
                    <p className="mt-1 truncate text-xs font-semibold leading-tight text-white/80 sm:text-sm">
                      {location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MerchantPageFinder() {
  return (
    <Suspense fallback={null}>
      <MerchantPageFinderContent />
    </Suspense>
  );
}
