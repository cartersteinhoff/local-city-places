import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  Check,
  Gift,
  Handshake,
  Mailbox,
  Map as MapIcon,
  Megaphone,
  MessageCircle,
  Mic,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { MarketLockStatus } from "@/lib/market-lock-status";
import { cn } from "@/lib/utils";
import {
  MarketLock360TrialRequestProvider,
  StartTrialButton,
  TrialRequestedBanner,
} from "./marketlock360-trial-request";

const includedFeatures = [
  {
    number: "01",
    title: "Category EXCLUSIVITY in City Marketplace",
    description:
      "Become the only featured business in your category within your city. Once your category is locked, competitors cannot occupy that position, giving you a powerful advantage in local visibility and lead generation.",
    image: "/images/marketlock360/category-exclusivity.webp",
    alt: "Category exclusivity locked for one featured city business",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "High Traffic Merchant Page",
    description:
      "Your own professional Merchant Page showcasing your business, offers, photos, videos, reviews, contact information, and direct customer actions designed to convert visitors into paying customers.",
    image: "/images/marketlock360/merchant-page.webp",
    alt: "High traffic digital merchant page shown across laptop and mobile",
    icon: Building2,
  },
  {
    number: "03",
    title: "1/4 Page Ad in City LIVE Magazine Monthly (Print & Digital)",
    description:
      "Reach local consumers every month through professionally designed advertising in both print and digital editions of your city's City LIVE Magazine.",
    image: "/images/marketlock360/city-live-ad.webp",
    alt: "City LIVE magazine print and digital ad placement",
    icon: Newspaper,
  },
  {
    number: "04",
    title: "100 Printed City LIVE™ Magazines for Distribution",
    description:
      "Receive 100 professionally printed magazines each month to place in your business, giving customers valuable local content while reinforcing your brand presence.",
    image: "/images/marketlock360/city-live-distribution.webp",
    alt: "Printed City LIVE magazines distributed at a local business counter",
    icon: BadgeCheck,
  },
  {
    number: "05",
    title: "Merchant Ad Mailed to 5,000 Homes via EDDM Postcard Campaign",
    description:
      "Your business is featured in a professionally designed postcard mailed directly to thousands of local households, helping you stay top-of-mind with nearby consumers.",
    image: "/images/marketlock360/eddm-postcard-campaign.webp",
    alt: "EDDM postcard campaign delivered directly to neighborhood mailboxes",
    icon: Mailbox,
  },
  {
    number: "06",
    title:
      "Merchant Interview (First Month) with UNLIMITED Plays on KLCP 96.5 FM",
    description:
      "Tell your story through a professionally produced Merchant Interview broadcast on KLCP 96.5 FM with unlimited airplay throughout the month.",
    image: "/images/marketlock360/merchant-interview.webp",
    alt: "Merchant interview recorded in a KLCP 96.5 FM radio studio",
    icon: Mic,
  },
  {
    number: "07",
    title: "Citywide Matching Prize Sweepstakes - Custom Merchant Sweepstakes",
    description:
      "Generate leads and customer engagement through your own branded sweepstakes while benefiting from participation in the citywide Matching Prize Sweepstakes network.",
    image: "/images/marketlock360/citywide-sweepstakes.webp",
    alt: "Citywide matching prize sweepstakes with customers and entry forms",
    icon: Gift,
  },
  {
    number: "08",
    title: "PREMIUM Membership in The Phoenix METRO Chamber of Commerce",
    description:
      "Enjoy premium access to Arizona's fastest-growing business community, designed to help local businesses increase visibility, connections, and revenue opportunities.",
    image: "/images/marketlock360/phoenix-metro-chamber.webp",
    alt: "Phoenix METRO Chamber of Commerce premium membership",
    icon: Handshake,
  },
];

const aiStaff = [
  { title: "Customer engagement", icon: MessageCircle },
  { title: "Lead follow-up", icon: Users },
  { title: "Appointment requests", icon: CalendarCheck },
  { title: "Content assistance", icon: Megaphone },
  { title: "Business automation", icon: Bot },
  { title: "AI communication support", icon: Sparkles },
];

const gbpFeatures = [
  { title: "Google Maps visibility", icon: MapIcon },
  { title: "Local search rankings", icon: Search },
  { title: "Customer engagement", icon: Users },
  { title: "Review activity", icon: Star },
  { title: "Profile performance", icon: BarChart3 },
];

const heroStats = [
  { value: "8", label: "Growth channels" },
  { value: "5,000", label: "Homes mailed monthly" },
  { value: "96.5 FM", label: "Unlimited airplay" },
  { value: "$300", label: "Trial bonus value" },
];

const trialHighlights = [
  "No credit card required",
  "14 days to experience results",
  "See the impact on your business",
  "Decide if it is right for you",
];

const whyDifferent = [
  "KLCP 96.5 FM radio exposure",
  "Print and digital magazine distribution",
  "Direct mail exposure",
  "AI staff automation",
  "Sweepstakes traffic generation",
  "Referral-driven city marketplace positioning",
];

function OptionalUpgradesSection() {
  return (
    <section className="bg-[#061b2d] px-6 py-10 text-white sm:px-8 lg:py-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
            Optional upgrades
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
            Go even further when you are ready.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/35 bg-[#0b2537] p-6 shadow-[0_20px_55px_rgba(0,0,0,0.22)] transition hover:border-emerald-300/60">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.3)]">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                  Pro upgrade
                </p>
                <h3 className="text-2xl font-black text-white">
                  4 premium LOCAL AI Staff employees
                </h3>
              </div>
            </div>
            <p className="mt-4 text-base font-semibold italic text-white/68">
              Your AI staff can assist with:
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {aiStaff.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-emerald-300/16 bg-emerald-400/10 p-3 text-center transition hover:border-emerald-300/40 hover:bg-emerald-400/16"
                >
                  <item.icon className="mx-auto h-6 w-6 text-emerald-300" />
                  <p className="mt-2 text-sm font-black leading-tight text-white/86">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/35 bg-[#0b2537] p-6 shadow-[0_20px_55px_rgba(0,0,0,0.22)] transition hover:border-amber-300/60">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.3)]">
                <MapIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                  Dominator upgrade
                </p>
                <h3 className="text-2xl font-black text-white">
                  Premium Google Business Profile optimization
                </h3>
              </div>
            </div>
            <p className="mt-4 text-base font-semibold italic text-white/68">
              Designed to help dominate:
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {gbpFeatures.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-amber-300/16 bg-amber-400/10 p-3 text-center transition hover:border-amber-300/40 hover:bg-amber-400/16"
                >
                  <item.icon className="mx-auto h-6 w-6 text-amber-300" />
                  <p className="mt-2 text-sm font-black leading-tight text-white/86">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface MarketLock360ContentProps {
  initialStatus?: MarketLockStatus;
}

export function MarketLock360Content({
  initialStatus = "basic",
}: MarketLock360ContentProps) {
  return (
    <MarketLock360TrialRequestProvider initialStatus={initialStatus}>
      <div className="min-h-full overflow-x-clip bg-[#061b2d] text-white">
        <TrialRequestedBanner />
        <main>
          <section className="relative isolate overflow-hidden bg-[#04131f] text-white">
            <div className="absolute inset-0">
              <Image
                src="/images/phoenix-skyline-section-desktop-v3.webp"
                alt=""
                fill
                priority
                className="object-cover opacity-48"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#04131f_0%,rgba(4,19,31,0.92)_38%,rgba(4,19,31,0.58)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(4,19,31,0)_0%,#061b2d_100%)]" />
            </div>

            <div className="relative mx-auto grid max-w-[1500px] gap-8 px-6 py-10 sm:px-8 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center lg:px-9 lg:py-12 xl:grid-cols-[minmax(0,1fr)_minmax(460px,600px)]">
              <div className="animate-rise-in max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-white/78">
                  <span className="rounded-full border border-orange-300/35 bg-orange-500/18 px-3 py-1.5 text-orange-100">
                    Local City Places Growth Engine
                  </span>
                </div>

                <h1 className="max-w-[860px] text-[clamp(2.6rem,4.2vw,4.5rem)] font-black uppercase leading-[0.95] text-white">
                  MarketLOCK360
                  <span className="block text-orange-400">
                    Lock in your city.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/82 xl:text-lg">
                  Built to position your business as the exclusive local leader
                  in your category with merchant pages, live media, direct mail,
                  sweepstakes, AI staff, and search optimization.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="#included"
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400 sm:w-auto"
                  >
                    See what is included
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <StartTrialButton
                    variant="secondary"
                    className="w-full sm:w-auto"
                  />
                </div>

                <div className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 sm:grid-cols-4">
                  {heroStats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-black leading-none text-white">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="animate-rise-in relative mx-auto hidden w-full max-w-[480px] lg:ml-auto lg:block xl:max-w-[650px]"
                style={{ animationDelay: "120ms" }}
              >
                <div className="absolute -inset-4 rounded-full bg-sky-400/12 blur-3xl" />
                <Image
                  src="/images/marketlock360/market-lock-360-logo.png"
                  alt="MarketLOCK360 logo"
                  width={747}
                  height={702}
                  priority
                  className="relative h-auto w-full rounded-[8px] drop-shadow-[0_28px_65px_rgba(0,0,0,0.42)]"
                  sizes="(min-width: 1280px) 600px, (min-width: 1024px) 440px, 80vw"
                />
              </div>
            </div>
          </section>

          <section
            id="included"
            className="relative bg-[#061b2d] px-6 py-10 text-white sm:px-8 lg:py-12"
          >
            <div className="mx-auto max-w-[1500px]">
              <div className="mb-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
                    Included in MarketLOCK360
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
                    Eight ways to lock down your local market.
                  </h2>
                </div>
                <p className="max-w-2xl text-base font-medium leading-7 text-white/72 lg:ml-auto lg:border-l-2 lg:border-orange-400/60 lg:pl-6">
                  Unlike traditional ad platforms that place you beside
                  competitors, MarketLOCK360 positions your business as the
                  exclusive featured business in your category within your city.
                </p>
              </div>

              <div className="space-y-6 lg:space-y-8">
                {includedFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  const imageFirst = index % 2 === 1;

                  return (
                    <article
                      key={feature.title}
                      className="group animate-rise-in-scroll overflow-hidden rounded-2xl border border-white/10 bg-[#0b2537] shadow-[0_20px_55px_rgba(0,0,0,0.22)] transition hover:border-orange-300/45 hover:bg-[#0e2c41] hover:shadow-[0_26px_65px_rgba(0,0,0,0.32)]"
                    >
                      <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                        <div
                          className={cn(
                            "relative aspect-[3/2] min-h-[230px] overflow-hidden bg-[#04131f]",
                            imageFirst && "lg:order-2",
                          )}
                        >
                          <Image
                            src={feature.image}
                            alt={feature.alt}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-[1.025]"
                            sizes="(min-width: 1024px) 58vw, 100vw"
                          />
                        </div>

                        <div className="relative flex min-h-full flex-col justify-center p-5 sm:p-7 lg:p-9">
                          <span
                            aria-hidden
                            className="pointer-events-none absolute right-5 top-4 select-none text-[4rem] font-black leading-none text-white/[0.07] transition group-hover:text-orange-400/20 sm:right-7 sm:top-6 lg:text-[5rem]"
                          >
                            {feature.number}
                          </span>

                          <span className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-400/12 text-sky-200 transition group-hover:bg-orange-500 group-hover:text-white">
                            <Icon className="h-5 w-5" />
                          </span>

                          <h3 className="pr-10 text-xl font-black leading-tight text-white sm:text-2xl">
                            {feature.title}
                          </h3>
                          <div className="mt-4 h-1 w-12 rounded-full bg-orange-400/80 transition-all duration-500 group-hover:w-20" />
                          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/72">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="trial"
            className="relative overflow-hidden bg-[#061b2d] px-6 py-10 text-white sm:px-8 lg:py-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(249,115,22,0.26),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(56,189,248,0.18),transparent_32%)]" />
            <div className="relative mx-auto max-w-[1500px]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-300">
                    14-day free trial
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl lg:text-[2.8rem]">
                    Experience MarketLOCK360 risk-free.
                  </h2>
                  <p className="mt-5 text-lg font-semibold leading-8 text-white/76">
                    See how MarketLOCK360 can position your business as the
                    exclusive leader in your category, increase visibility, and
                    drive more customers to your business.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {trialHighlights.map((item) => (
                      <div
                        key={item}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/7 px-4 py-3"
                      >
                        <Check className="h-5 w-5 shrink-0 text-orange-300" />
                        <span className="text-sm font-black uppercase tracking-wide">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-300/35 bg-black/24 p-6 transition hover:border-amber-300/60 hover:bg-black/32 sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-black uppercase text-slate-950">
                      Trial bonus
                    </span>
                    <span className="text-sm font-black uppercase text-amber-200">
                      Value $300
                    </span>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/14 text-amber-300">
                    <Newspaper className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-2xl font-black">
                    Premium press release
                  </h3>
                  <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/70">
                    Published on major media networks to support immediate SEO
                    advancement.
                  </p>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.055] p-6">
                <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">
                      Why it is different
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
                      Not just ads beside competitors.
                    </h2>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {whyDifferent.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm font-bold text-white/78"
                      >
                        <Zap className="h-4 w-4 shrink-0 text-orange-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-2xl font-black uppercase leading-tight sm:text-3xl">
                    Lock in your category.{" "}
                    <span className="text-orange-300">Dominate your city.</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white/55">
                    Grow your business with Local City Places.
                  </p>
                </div>
                <StartTrialButton />
              </div>
            </div>
          </section>

          <OptionalUpgradesSection />
        </main>
      </div>
    </MarketLock360TrialRequestProvider>
  );
}
