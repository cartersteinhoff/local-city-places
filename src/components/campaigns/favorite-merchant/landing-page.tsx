"use client";

import { Playfair_Display, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Camera,
  Gift,
  MailCheck,
  ShieldCheck,
  Store,
  Trophy,
  UserPlus,
} from "lucide-react";
import { FeaturedMarquee } from "@/components/featured-marquee";
import { Footer } from "@/components/footer";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { MerchantSpotlightGrid } from "./merchant-spotlight-grid";
import { SweepstakesEntryForm } from "./sweepstakes-entry-form";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const campaignRhythm = [
  {
    step: "01",
    title: "Enter once per day",
    cue: "Daily return habit",
    description:
      "The landing page stays alive because members can come back every Arizona day and take another shot at the monthly prize.",
    icon: Trophy,
  },
  {
    step: "02",
    title: "Confirm by magic link",
    cue: "Fast path to dashboard",
    description:
      "Confirmation should feel almost invisible, but it still turns an email capture into a real member session.",
    icon: MailCheck,
  },
  {
    step: "03",
    title: "Share your referral link",
    cue: "Matching prize engine",
    description:
      "This is the mechanic that makes the campaign spread. People are not just entering. They are building a chain.",
    icon: UserPlus,
  },
  {
    step: "04",
    title: "Nominate favorite merchants",
    cue: "Merchant story loop",
    description:
      "After login, the campaign becomes content. Members nominate merchants, submit photos, and give admin something worth publishing.",
    icon: Store,
  },
];

const relayScript = [
  "You invite Sally.",
  "Sally invites Jim.",
  "Jim wins the grand prize.",
  "Sally wins because she referred Jim.",
  "You win because Jim sits on your second tier.",
];

const nominationBreakdown = [
  {
    title: "Prompt the story",
    description: "The dashboard should open with one clear question: who is your favorite merchant and why?",
    accent: "One clear prompt",
  },
  {
    title: "Require proof",
    description: "Members need at least 50 words and at least 2 photos so the nomination feels real, not generic.",
    accent: "Words plus photos",
  },
  {
    title: "Moderate before publishing",
    description: "Admin reviews every nomination before it appears publicly in a separate merchant-page section.",
    accent: "Admin controlled",
  },
  {
    title: "Start the $25 path",
    description: "Approval should kick off the certificate process, then qualification and store rules take over from there.",
    accent: "Reward after approval",
  },
];

export function FavoriteMerchantLandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  return (
    <div className={`min-h-screen bg-[#f5efe7] text-[#1f1510] ${sans.className}`}>
      <header className="sticky top-0 z-30">
        <div className="border-b border-white/10 bg-[#120b08]/78 text-white backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" aria-label="Back to Local City Places">
              <Image
                src="/images/logo-horizontal.png"
                alt="Local City Places"
                width={650}
                height={286}
                className="h-10 w-auto sm:h-11"
                priority
              />
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium text-white/74 lg:flex">
              <a href="#how-it-works" className="transition-colors hover:text-white">
                How It Works
              </a>
              <a href="#entry-form" className="transition-colors hover:text-white">
                Enter Today
              </a>
            </div>

            <Button
              size="sm"
              className="rounded-full bg-white px-5 font-semibold text-zinc-900 shadow-lg hover:bg-white/90"
              onClick={() => {
                setLoginEmail("");
                setLoginOpen(true);
              }}
            >
              Login
            </Button>
          </div>
        </div>

        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          defaultEmail={loginEmail}
        />
      </header>

      <section className="relative overflow-hidden bg-[#1b100b] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,162,70,0.38),transparent_36%),radial-gradient(circle_at_80%_12%,rgba(118,181,79,0.16),transparent_28%),linear-gradient(180deg,#1b100b_0%,#28160f_48%,#120b08_100%)]" />
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#ff9d4d]/20 blur-3xl animate-drift-soft" />
        <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-[#76b54f]/14 blur-3xl animate-drift-soft-reverse" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-18 lg:px-8 lg:pb-22 lg:pt-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="animate-rise-in space-y-7">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/78 sm:text-[0.8rem]">
                <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
                  Favorite Merchant Sweepstakes
                </span>
                <span>Monthly campaign</span>
                <span>Arizona time</span>
              </div>

              <div className="space-y-4">
                <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ffcf8b] sm:text-[1.02rem]">
                  Win $500 in gas or groceries
                </p>
                <h1 className={`max-w-4xl text-balance text-4xl font-semibold leading-[0.98] sm:text-5xl lg:text-6xl xl:text-7xl ${display.className}`}>
                  Back your favorite local merchant.
                  <span className="block text-[#ffcf8b]">Bring people with you.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/82 sm:text-[1.35rem] sm:leading-9">
                  Enter once per day, confirm by magic link, and keep the momentum going inside your member dashboard where referrals and favorite-merchant nominations turn into the real story.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-base leading-7 text-white/80 sm:hidden">
                Daily entry. Matching prize tiers. Approved nominations unlock a $25 reward.
              </div>

              <div className="hidden gap-3 text-base leading-7 text-white/80 sm:grid sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3">
                  Sweepstakes opens on the first and closes at 11:59 PM Arizona time on the last day of the month.
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3">
                  Matching winners can pay out on your first tier and your second tier.
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3">
                  Approved favorite-merchant nominations unlock a $25 reward.
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-[#ffcf8b] px-7 text-[#1b100b] hover:bg-[#ffd9a7]"
                >
                  <a href="#entry-form">
                    Enter today
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/18 bg-white/6 px-7 text-white hover:bg-white/12"
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </div>

            <div className="animate-rise-in lg:pl-4" style={{ animationDelay: "120ms" }}>
              <SweepstakesEntryForm
                onRequireLogin={(email) => {
                  setLoginEmail(email);
                  setLoginOpen(true);
                }}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-rise-in rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]" style={{ animationDelay: "180ms" }}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    Matching prize explained
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Make the referral upside obvious in one glance.
                  </h2>
                </div>
                <span className="rounded-full border border-white/12 bg-black/16 px-3 py-1.5 text-sm text-white/78">
                  First tier + second tier
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">You</p>
                  <p className="mt-2 text-lg font-semibold text-white">Referral link owner</p>
                  <p className="mt-2 text-base leading-7 text-white/74">You brought the chain into motion.</p>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <div className="h-px w-8 bg-[linear-gradient(90deg,rgba(255,207,139,0.08),rgba(255,207,139,0.85),rgba(255,207,139,0.08))]" />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">Sally</p>
                  <p className="mt-2 text-lg font-semibold text-white">First-tier referral</p>
                  <p className="mt-2 text-base leading-7 text-white/74">She referred Jim into the sweepstakes.</p>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <div className="h-px w-8 bg-[linear-gradient(90deg,rgba(255,207,139,0.08),rgba(255,207,139,0.85),rgba(255,207,139,0.08))]" />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-[#ffcf8b]/12 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">Jim</p>
                  <p className="mt-2 text-lg font-semibold text-white">Grand prize winner</p>
                  <p className="mt-2 text-base leading-7 text-white/74">That result can trigger matching winners above him.</p>
                </div>
              </div>
            </div>

            <div className="animate-rise-in rounded-[2rem] border border-[#ffcf8b]/18 bg-[#fff7ee] p-6 text-[#23140d] shadow-[0_20px_60px_rgba(0,0,0,0.16)]" style={{ animationDelay: "220ms" }}>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ab6731]">
                What happens next
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">
                Entry is just the front door.
              </h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-1 h-4 w-4 text-[#ab6731]" />
                  <p className="text-base leading-8 text-[#5e483a]">
                    Magic-link confirmation moves people straight into the member dashboard.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Store className="mt-1 h-4 w-4 text-[#ab6731]" />
                  <p className="text-base leading-8 text-[#5e483a]">
                    Members are prompted to nominate their favorite merchants and explain why they matter.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="mt-1 h-4 w-4 text-[#ab6731]" />
                  <p className="text-base leading-8 text-[#5e483a]">
                    Approved nominations can trigger a $25 gas or grocery reward and fresh merchant proof.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e6d8ca] bg-[#f5efe7]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ab6731]">
                Campaign rhythm
              </p>
              <h2 className={`max-w-xl text-balance text-4xl leading-tight text-[#1f1510] sm:text-5xl ${display.className}`}>
                One entry turns into a referral machine and a merchant story.
              </h2>
              <p className="max-w-lg text-lg leading-8 text-[#645347]">
                The page should not explain the sweepstakes with generic feature cards. It should break the campaign into a few memorable beats people can repeat.
              </p>
            </div>

            <div className="border-t border-[#dcc8b4]">
              {campaignRhythm.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.step}
                    className="grid gap-5 border-b border-[#dcc8b4] py-6 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-4xl leading-none text-[#ab6731] sm:text-5xl ${display.className}`}>
                        {step.step}
                      </span>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c4ad] bg-white text-[#ab6731] md:hidden">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#d9c4ad] bg-white text-[#ab6731] md:inline-flex">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-2xl font-semibold text-[#1f1510]">{step.title}</h3>
                      </div>
                      <p className="max-w-2xl text-base leading-8 text-[#645347]">{step.description}</p>
                    </div>

                    <div className="md:flex md:justify-end">
                      <span className="inline-flex rounded-full border border-[#d9c4ad] bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#8f5a31]">
                        {step.cue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[#2f1d15] bg-[#140d09] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,190,97,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                Matching prize relay
              </p>
              <h2 className={`max-w-xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}>
                The share mechanic should read like a chain reaction, not legal copy.
              </h2>
              <p className="max-w-xl text-lg leading-8 text-white/76">
                If people can picture the referral chain instantly, they can explain it instantly. That is what makes this campaign spread.
              </p>

              <div className="border-y border-white/10">
                {relayScript.map((line, index) => (
                  <div
                    key={line}
                    className={[
                      "flex items-start gap-4 py-4",
                      index !== 0 ? "border-t border-white/10" : "",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 text-sm font-semibold text-[#ffcf8b]">
                      {index + 1}
                    </span>
                    <p className="text-lg leading-8 text-white/84">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,176,82,0.2),transparent_34%)]" />
              <div className="relative flex flex-col gap-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
                  {[
                    {
                      name: "You",
                      label: "Second-tier winner",
                      note: "Your original invite set the chain in motion.",
                    },
                    {
                      name: "Sally",
                      label: "First-tier winner",
                      note: "She referred the person who eventually won.",
                    },
                    {
                      name: "Jim",
                      label: "Grand prize winner",
                      note: "The picked winner can create matching winners above him.",
                    },
                  ].map((person, index) => (
                    <div key={person.name} className="contents">
                      <div className="border border-white/12 bg-black/14 px-5 py-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                          {person.name}
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">{person.label}</h3>
                        <p className="mt-3 text-base leading-7 text-white/72">{person.note}</p>
                      </div>

                      {index < 2 && (
                        <div className="hidden h-px bg-[linear-gradient(90deg,rgba(255,207,139,0.15),rgba(255,207,139,0.8),rgba(255,207,139,0.15))] lg:block" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-lg leading-8 text-white/78">
                    One winning entry can create three winners from the same referral chain. That is the clever part of the campaign and the page should make it feel obvious.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e6d8ca] bg-[#fff8ef]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="relative overflow-hidden rounded-[2.2rem] bg-[#1f1510] px-6 py-8 text-white shadow-[0_24px_80px_rgba(31,21,16,0.18)] sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,180,88,0.22),transparent_42%),radial-gradient(circle_at_80%_18%,rgba(107,179,82,0.12),transparent_28%)]" />
              <div className="relative space-y-8">
                <div className="space-y-4">
                  <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    After they enter
                  </p>
                  <h2 className={`max-w-2xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}>
                    "Who's your favorite merchant and why?"
                  </h2>
                  <p className="max-w-2xl text-lg leading-8 text-white/76">
                    That question should dominate the dashboard. It is the bridge between sweepstakes participation, merchant storytelling, and the approval-based reward path.
                  </p>
                </div>

                <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
                  <div>
                    <MailCheck className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Confirm first
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      The magic link should hand the member straight into this next step without extra friction.
                    </p>
                  </div>
                  <div>
                    <Camera className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Bring proof
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      Fifty words and two photos make the nomination feel lived-in and worth moderating.
                    </p>
                  </div>
                  <div>
                    <Gift className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Qualify after approval
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      Approval starts the $25 certificate path. Store selection and qualification still happen after that.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#dcc8b4]">
              {nominationBreakdown.map((item, index) => (
                <div
                  key={item.title}
                  className={[
                    "grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-start",
                    index !== 0 ? "border-t border-[#dcc8b4]" : "",
                  ].join(" ")}
                >
                  <div>
                    <h3 className="text-2xl font-semibold text-[#1f1510]">{item.title}</h3>
                    <p className="mt-3 max-w-2xl text-base leading-8 text-[#645347]">
                      {item.description}
                    </p>
                  </div>
                  <span className="inline-flex h-fit rounded-full border border-[#d9c4ad] bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#8f5a31]">
                    {item.accent}
                  </span>
                </div>
              ))}

              <div className="border-t border-[#dcc8b4] py-6">
                <p className="text-lg leading-8 text-[#3d2b21]">
                  Members can submit up to five favorite-merchant nominations per calendar month, and approved posts should land in a dedicated merchant-page section called{" "}
                  <span className="font-semibold">Nominated As A Favorite Merchant</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#140d09] py-14 text-white lg:py-18">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%,transparent_76%,rgba(255,255,255,0.02))]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                Local merchants
              </p>
              <h2 className={`max-w-2xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}>
                Show the kind of merchants people can champion.
              </h2>
            </div>
            <p className="max-w-lg text-base leading-8 text-white/74">
              The prize gets stronger when it feels connected to real businesses people already care about and want to champion.
            </p>
          </div>

          <div className="mb-8">
            <MerchantSpotlightGrid />
          </div>

          <FeaturedMarquee showHeading={false} />
        </div>
      </section>

      <section className="border-b border-[#e7d7c8] bg-[#fff8ef]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-8 rounded-[2rem] border border-[#e7d7c8] bg-white px-6 py-8 shadow-[0_16px_50px_rgba(66,37,18,0.08)] lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ab6731]">
                Enter today
              </p>
              <h2 className={`max-w-2xl text-balance text-4xl leading-tight text-[#1f1510] sm:text-5xl ${display.className}`}>
                Enter today and start your referral chain.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-[#645347]">
                One strong prize, one clear action, and a faster path into the dashboard where the real merchant story begins.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="h-12 rounded-full px-7">
                <a href="#entry-form">
                  Enter the sweepstakes
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-[#dbc4ac] bg-transparent px-7 text-[#1f1510] hover:bg-[#f5ede2]"
              >
                <a href="#how-it-works">
                  Review the flow
                  <ShieldCheck className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="light" />
    </div>
  );
}
