import {
  MonitorSmartphone,
  Music2,
  Radio,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { HomeHeader } from "@/components/home-header";
import { MerchantPhotoStrip } from "@/components/merchant-photo-strip";
import { RequestForm } from "@/components/request-form";
import { getFeaturedMerchants } from "@/lib/featured-merchants";

export const metadata: Metadata = {
  title: "Request a Phoenix Metro Business Category | Local City Places",
  description:
    "Request consideration for the Local City Places Phoenix Metro 250 business selection.",
};

export const revalidate = 3600;

const foundingMerchantPackage = [
  {
    icon: Radio,
    service: "Custom radio spot production",
  },
  {
    icon: Music2,
    service: "Custom Signature Soundtrack",
  },
  {
    icon: MonitorSmartphone,
    service: "Public merchant page",
  },
  {
    icon: ShieldCheck,
    service: "Exclusive category reservation",
  },
  {
    icon: RadioTower,
    service: "Airplay on KLCP 96.5 FM",
  },
] as const;

export default async function RequestPage() {
  const featuredMerchants = await getFeaturedMerchants();

  return (
    <>
      <main className="bg-[#f3f6f4] text-slate-950">
        <section className="relative isolate overflow-hidden bg-[#061b28] text-white">
          <Image
            src="/images/new-year-250-background.jpg"
            alt="Phoenix skyline with fireworks for America 250"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-[0.86]"
            priority
          />
          <div
            className="absolute inset-0 bg-[#04131f]/68"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,19,31,0.95)_0%,rgba(4,19,31,0.78)_42%,rgba(4,19,31,0.42)_100%)]"
            aria-hidden="true"
          />
          <HomeHeader variant="transparent" />

          <div className="relative mx-auto grid min-h-[calc(100svh-5.75rem)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(430px,0.84fr)] lg:items-start lg:py-10">
            <div className="max-w-2xl py-8 lg:py-0">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ffb36d]">
                Phoenix Metro 250 Selection
              </p>
              <h1 className="mt-5 max-w-2xl tracking-normal">
                <span className="block text-[50px] font-black leading-[1]">
                  <span className="text-[#ff3f3f]">America</span>{" "}
                  <span className="text-white">Turns</span>{" "}
                  <span className="text-[#3f8cff]">250.</span>
                </span>
                <span className="mt-3 block text-[32px] font-black leading-tight text-white/92">
                  We&apos;re selecting 250 Phoenix Metro businesses.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-white/82 sm:text-lg">
                Request your city and category for review. Each submission is
                timestamped so category priority can be handled in the order it
                arrives.
              </p>

              <div className="mt-7 max-w-xl border-y border-white/16 py-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb36d]">
                  Complimentary Founding Merchant Package
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {foundingMerchantPackage.map(({ icon: Icon, service }) => (
                    <div className="flex items-start gap-3" key={service}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ffb36d]/40 bg-[#ffb36d]/12 text-[#ffb36d]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-normal leading-6 text-white/84 sm:text-base">
                        {service}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm font-normal leading-6 text-white/70">
                  No cost to request. No obligation. Categories are reviewed
                  first come, first served by timestamp.
                </p>
              </div>

              <div className="mt-5 max-w-xl border-l-4 border-[#ffb36d] bg-white/8 px-4 py-3 ring-1 ring-white/12">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb36d]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                      Timestamp rule
                    </p>
                    <p className="mt-1 text-sm font-normal leading-6 text-white/78">
                      Categories are reviewed in the order requests are received
                      for each city and category.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="request-form" className="w-full py-8 lg:py-0">
              <RequestForm />
            </div>
          </div>
        </section>

        <section
          id="merchant-examples"
          className="overflow-hidden bg-[#04131f]"
        >
          <MerchantPhotoStrip
            initialMerchants={featuredMerchants}
            className="pt-0"
          />
        </section>
      </main>
      <Footer variant="dark" />
    </>
  );
}
