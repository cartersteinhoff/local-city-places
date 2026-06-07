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
  Music,
  Newspaper,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MarketLOCK360 Pricing | Local City Places",
  description:
    "Compare MarketLOCK360 local growth plans with category exclusivity, KLCP radio, City LIVE magazine, direct mail, sweepstakes, AI staff, and Google Business Profile optimization.",
};

const baseFeatures = [
  {
    title: "Category exclusivity",
    detail:
      "Be the exclusive featured business in your category inside your city marketplace.",
    icon: ShieldCheck,
  },
  {
    title: "High traffic merchant page",
    detail:
      "A Local City Places merchant page built for local visibility and customer action.",
    icon: Building2,
  },
  {
    title: "1/4 page City LIVE Magazine ad",
    detail: "Print and digital placement in City LIVE Magazine.",
    icon: Newspaper,
  },
  {
    title: "100 printed City LIVE magazines",
    detail: "Copies for distribution through your merchant location.",
    icon: BadgeCheck,
  },
  {
    title: "Merchant ad to 5,000 homes",
    detail: "EDDM postcard campaign delivered to local households.",
    icon: Mailbox,
  },
  {
    title: "First-month merchant interview",
    detail: "Interview exposure on KLCP 96.5 FM with unlimited plays.",
    icon: Mic,
  },
  {
    title: "15, 30 and 60 second radio spots",
    detail: "KLCP 96.5 FM radio spots with unlimited plays.",
    icon: Radio,
  },
  {
    title: "Citywide prize sweepstakes",
    detail:
      "Matching prize sweepstakes plus custom merchant sweepstakes support.",
    icon: Gift,
  },
  {
    title: "Phoenix METRO Chamber membership",
    detail: "Premium membership positioning for added local credibility.",
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

const planRows = [
  {
    name: "MarketLOCK360",
    price: "$998",
    cadence: "/mo.",
    accent: "blue",
    line: "Exclusive. Visible. Trusted. Preferred.",
    summary:
      "The core local visibility package for locking in one city category and turning media into marketplace traffic.",
    includes: [
      "Category exclusivity in city marketplace",
      "Merchant page, magazine, radio and direct mail",
      "Citywide and custom merchant sweepstakes",
      "Phoenix METRO Chamber premium membership",
    ],
  },
  {
    name: "MarketLOCK360 Pro",
    price: "$1,497",
    cadence: "/mo.",
    accent: "green",
    line: "Smarter business. Stronger results.",
    summary:
      "Everything in MarketLOCK360, plus four premium LOCAL AI Staff employees for follow-up and automation.",
    includes: [
      "Everything in MarketLOCK360",
      "4 premium LOCAL AI Staff employees",
      "Lead follow-up and appointment request support",
      "Content and communication assistance",
    ],
    featured: true,
  },
  {
    name: "MarketLOCK360 Dominator",
    price: "$1,996",
    cadence: "/mo.",
    accent: "gold",
    line: "Maximum visibility. Market domination.",
    summary:
      "Everything in MarketLOCK360 Pro, plus premium Google Business Profile optimization.",
    includes: [
      "Everything in MarketLOCK360 and Pro",
      "Premium Google Business Profile optimization",
      "Google Maps and local search visibility support",
      "Review activity and business profile performance focus",
    ],
  },
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

function PlanAccentIcon({ accent }: { accent: string }) {
  const iconClasses = {
    blue: "bg-sky-500 text-white shadow-sky-950/20",
    green: "bg-emerald-500 text-white shadow-emerald-950/20",
    gold: "bg-amber-500 text-slate-950 shadow-amber-950/20",
  }[accent];

  const Icon =
    accent === "green" ? Bot : accent === "gold" ? Trophy : Building2;

  return (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-lg shadow-lg",
        iconClasses,
      )}
      aria-hidden="true"
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

function PlanAccentBar({ accent }: { accent: string }) {
  const className = {
    blue: "bg-sky-500",
    green: "bg-emerald-500",
    gold: "bg-amber-500",
  }[accent];

  return <span className={cn("block h-1 w-full rounded-full", className)} />;
}

function MarketLockHeader() {
  return (
    <header className="relative z-20 border-b border-sky-300/10 bg-[linear-gradient(135deg,#063860_0%,#01233f_54%,#04131f_100%)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Go to Local City Places homepage">
          <Image
            src="/images/local-city-places-header-logo-v12.webp"
            alt="Local City Places"
            width={161}
            height={72}
            className="h-auto w-[128px] sm:w-[161px]"
            priority
          />
        </Link>

        <nav
          aria-label="MarketLOCK360 page links"
          className="flex items-center gap-2"
        >
          <Link
            href="#pricing"
            className="hidden h-10 items-center justify-center rounded-lg border border-white/15 bg-white/8 px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/14 sm:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="#trial"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-500 px-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(249,115,22,0.25)] transition hover:bg-orange-400 sm:px-4 sm:text-sm"
          >
            14-day trial
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function MarketLock360Page() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#061b2d] text-white">
      <MarketLockHeader />

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

          <div className="relative mx-auto grid min-h-[calc(100svh-10rem)] max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[calc(100svh-14rem)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-center lg:px-8 lg:py-12">
            <div className="animate-rise-in max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-white/78">
                <span className="rounded-full border border-orange-300/35 bg-orange-500/18 px-3 py-1.5 text-orange-100">
                  Local City Places Growth Engine
                </span>
                <span>KLCP 96.5 FM</span>
                <span>City LIVE Magazine</span>
              </div>

              <h1 className="max-w-4xl text-balance text-4xl font-black uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                MarketLOCK360
                <span className="block text-orange-400">
                  Lock in your city.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/82 sm:text-xl">
                Built to position your business as the exclusive local leader in
                your category with merchant pages, live media, direct mail,
                sweepstakes, AI staff, and search optimization.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="#pricing"
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400 sm:w-auto"
                >
                  Compare plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#trial"
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/16 sm:w-auto"
                >
                  Start 14-day trial
                </Link>
              </div>
            </div>

            <div
              className="animate-rise-in relative mx-auto hidden w-full max-w-[430px] lg:ml-auto lg:block"
              style={{ animationDelay: "120ms" }}
            >
              <div className="absolute -inset-4 rounded-full bg-sky-400/12 blur-3xl" />
              <Image
                src="/images/lcp-growth-engine.png"
                alt="Local City Places growth engine with MarketLOCK360"
                width={1024}
                height={1024}
                className="relative h-auto w-full drop-shadow-[0_28px_65px_rgba(0,0,0,0.42)]"
                sizes="(min-width: 1024px) 430px, 80vw"
              />
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="relative bg-[#061b2d] px-4 py-12 text-white sm:px-6 lg:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-600">
                  Pricing
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                  Choose your local growth level.
                </h2>
              </div>
              <p className="max-w-xl text-base font-medium leading-7 text-white/68">
                Each plan starts with city-category positioning. Upgrade when
                you want AI staff support or premium Google Business Profile
                optimization layered onto the media package.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {planRows.map((plan, index) => (
                <article
                  key={plan.name}
                  className={cn(
                    "animate-rise-in flex h-full flex-col rounded-lg border bg-[#0b2537] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:bg-[#0e2c41] hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]",
                    plan.featured
                      ? "border-emerald-300/70"
                      : "border-sky-200/15",
                  )}
                  style={{ animationDelay: `${80 * index}ms` }}
                >
                  <PlanAccentBar accent={plan.accent} />
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black uppercase leading-tight text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-2 text-sm font-black uppercase tracking-wide text-white/52">
                        {plan.line}
                      </p>
                    </div>
                    <PlanAccentIcon accent={plan.accent} />
                  </div>

                  {plan.featured && (
                    <p className="mt-4 w-fit rounded-full bg-emerald-400/16 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-200">
                      Best fit for follow-up
                    </p>
                  )}

                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl font-black tracking-tight text-white">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-lg font-black text-white/52">
                      {plan.cadence}
                    </span>
                  </div>

                  <p className="mt-5 min-h-[84px] text-base leading-7 text-white/68">
                    {plan.summary}
                  </p>

                  <div className="my-6 h-px bg-white/10" />

                  <ul className="space-y-3">
                    {plan.includes.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm font-semibold text-white/76"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="#trial"
                    className="mt-auto inline-flex h-11 items-center justify-center rounded-lg border border-white/14 px-4 text-sm font-black uppercase tracking-wide text-white transition hover:border-orange-400 hover:text-orange-300"
                  >
                    See trial offer
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#04131f] px-4 py-12 text-white sm:px-6 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="lg:sticky lg:top-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
                Included in MarketLOCK360
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">
                Media, marketplace, and sweepstakes in one local package.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-white/72">
                Unlike traditional ad platforms that place you beside
                competitors, MarketLOCK360 positions your business as the
                exclusive featured business in your category within your city.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {baseFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-orange-300/50 hover:bg-white/[0.075]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/12 text-sky-200 transition group-hover:bg-orange-500 group-hover:text-white">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black uppercase leading-snug text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-white/68">
                        {feature.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#061b2d] px-4 py-12 text-white sm:px-6 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-emerald-300/35 bg-[#0b2537] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Bot className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                    Pro upgrade
                  </p>
                  <h2 className="text-2xl font-black uppercase text-white">
                    4 premium LOCAL AI Staff employees
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-base font-semibold italic text-white/68">
                Your AI staff can assist with:
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {aiStaff.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-emerald-300/16 bg-emerald-400/10 p-3 text-center"
                  >
                    <item.icon className="mx-auto h-6 w-6 text-emerald-300" />
                    <p className="mt-2 text-sm font-black leading-tight text-white/86">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-amber-300/35 bg-[#0b2537] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                  <MapIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                    Dominator upgrade
                  </p>
                  <h2 className="text-2xl font-black uppercase text-white">
                    Premium Google Business Profile optimization
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-base font-semibold italic text-white/68">
                Designed to help dominate:
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {gbpFeatures.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-amber-300/16 bg-amber-400/10 p-3 text-center"
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
        </section>

        <section
          id="trial"
          className="relative overflow-hidden bg-[#061b2d] px-4 py-12 text-white sm:px-6 lg:py-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(249,115,22,0.26),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(56,189,248,0.18),transparent_32%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-300">
                  14-day free trial
                </p>
                <h2 className="mt-2 text-4xl font-black uppercase leading-[0.95] sm:text-5xl lg:text-6xl">
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
                      className="flex min-h-12 items-center gap-3 rounded-lg border border-white/10 bg-white/7 px-4 py-3"
                    >
                      <Check className="h-5 w-5 shrink-0 text-orange-300" />
                      <span className="text-sm font-black uppercase tracking-wide">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-amber-300/35 bg-black/24 p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-black uppercase text-slate-950">
                      Bonus #1
                    </span>
                    <span className="text-sm font-black uppercase text-amber-200">
                      Value $300
                    </span>
                  </div>
                  <Newspaper className="h-10 w-10 text-amber-300" />
                  <h3 className="mt-5 text-xl font-black uppercase">
                    Premium press release
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/70">
                    Published on major media networks to support immediate SEO
                    advancement.
                  </p>
                </div>

                <div className="rounded-lg border border-sky-300/35 bg-black/24 p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-sky-300 px-3 py-2 text-sm font-black uppercase text-slate-950">
                      Bonus #2
                    </span>
                    <span className="text-sm font-black uppercase text-sky-200">
                      Value $750
                    </span>
                  </div>
                  <Music className="h-10 w-10 text-sky-300" />
                  <h3 className="mt-5 text-xl font-black uppercase">
                    Signature soundtrack production
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/70">
                    Customer merchant brand song production with unlimited plays
                    on KLCP 96.5 FM.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.055] p-5">
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
              <Link
                href="mailto:hello@localcityplaces.com?subject=MarketLOCK360%2014-Day%20Trial"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
              >
                Request trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="dark" />
    </div>
  );
}
