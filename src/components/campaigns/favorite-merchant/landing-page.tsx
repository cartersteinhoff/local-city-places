"use client";

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
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { useState } from "react";
import { FeaturedMarquee } from "@/components/featured-marquee";
import { HomeHeader } from "@/components/home-header";
import { LoginModal } from "@/components/login-modal";
import { TopMarketsFooter } from "@/components/top-markets";
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
    title: "Create your member account",
    cue: "Start here",
    description:
      "Use the landing page form once, then finish setup from the email link so your member profile is ready for referrals and merchant nominations.",
    icon: MailCheck,
  },
  {
    step: "02",
    title: "Submit your first nomination",
    cue: "Lock in entry",
    description:
      "Your first favorite merchant nomination of the cycle creates your sweepstakes entry and puts you into the drawing.",
    icon: Trophy,
  },
  {
    step: "03",
    title: "Share your referral link",
    cue: "Grow your chain",
    description:
      "Invite friends with your link so their qualifying nominations can activate matching-prize entries above them.",
    icon: UserPlus,
  },
  {
    step: "04",
    title: "Keep championing local",
    cue: "Five per cycle",
    description:
      "Keep submitting favorite merchant stories and photos throughout the cycle, and approved nominations can still unlock the $25 reward path.",
    icon: Store,
  },
];

const heroHighlights = [
  {
    title: "Member signup first",
    description:
      "This page creates your member account and saves your referral code.",
  },
  {
    title: "Entry via nomination",
    description:
      "Your first favorite merchant nomination locks in your sweepstakes entry.",
  },
  {
    title: "Matching prize chain",
    description:
      "Referral matches activate when invited members submit nominations.",
  },
];

const relayScript = [
  "You invite Sally.",
  "Sally invites Jim.",
  "Jim wins the grand prize.",
  "Sally wins the first-tier match.",
  "You win the second-tier match.",
];

const nextSteps = [
  {
    title: "Finish account setup",
    description:
      "Use the email link from your first visit to finish account setup and open your member dashboard.",
    icon: MailCheck,
  },
  {
    title: "Submit your first nomination",
    description:
      "Your first favorite merchant nomination for the cycle locks in your sweepstakes entry.",
    icon: Trophy,
  },
  {
    title: "Share your referral link",
    description:
      "Invite friends so their qualifying nominations can activate matching winners above them in the chain.",
    icon: UserPlus,
  },
];

const nominationBreakdown = [
  {
    title: "Tell us who deserves it",
    description:
      "Start with one clear prompt: which merchant do you want to champion, and what makes them worth backing?",
    accent: "Favorite merchant",
  },
  {
    title: "Add real proof",
    description:
      "A short written story plus at least two photos helps each nomination feel specific, personal, and publishable.",
    accent: "Words plus photos",
  },
  {
    title: "Wait for approval",
    description:
      "Every nomination is reviewed before it appears publicly, keeping the merchant pages curated and credible.",
    accent: "Reviewed first",
  },
  {
    title: "Unlock the reward path",
    description:
      "Once a nomination is approved, the $25 gas or grocery reward path can begin, subject to the campaign rules.",
    accent: "$25 reward path",
  },
];

export function FavoriteMerchantLandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  return (
    <div
      className={`min-h-screen bg-[#f5efe7] text-[#1f1510] ${sans.className}`}
    >
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        defaultEmail={loginEmail}
      />

      <section className="relative overflow-hidden bg-[#1b100b] text-white">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,#b66a29_0%,#8f531f_35%,rgba(27,16,11,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,162,70,0.38),transparent_36%),radial-gradient(circle_at_80%_12%,rgba(118,181,79,0.16),transparent_28%),linear-gradient(180deg,#1b100b_0%,#28160f_48%,#120b08_100%)]" />
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#ff9d4d]/20 blur-3xl animate-drift-soft" />
        <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-[#76b54f]/14 blur-3xl animate-drift-soft-reverse" />

        <div className="relative z-20">
          <HomeHeader />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-18 lg:px-8 lg:pb-22 lg:pt-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,30rem)] lg:items-start">
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
                <h1
                  className={`max-w-4xl text-balance text-4xl font-semibold leading-[0.98] sm:text-5xl lg:text-6xl xl:text-7xl ${display.className}`}
                >
                  Back your favorite local merchant.
                  <span className="block text-[#ffcf8b]">
                    Bring people with you.
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/82 sm:text-[1.2rem] sm:leading-8">
                  Start by creating your member account. Once you are in, your
                  first favorite merchant nomination locks in your sweepstakes
                  entry for the current cycle.
                </p>
              </div>

              <div className="grid gap-3 text-base leading-7 text-white/80 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffcf8b]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="animate-rise-in lg:pl-4"
              style={{ animationDelay: "120ms" }}
            >
              <SweepstakesEntryForm
                onRequireLogin={(email) => {
                  setLoginEmail(email);
                  setLoginOpen(true);
                }}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div
              className="animate-rise-in rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
              style={{ animationDelay: "180ms" }}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    Matching prize explained
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    See how one winning entry can ripple back through the chain.
                  </h2>
                </div>
                <span className="rounded-full border border-white/12 bg-black/16 px-3 py-1.5 text-sm text-white/78">
                  Grand prize + matching winners
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    You
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Referral link owner
                  </p>
                  <p className="mt-2 text-base leading-7 text-white/74">
                    Your invite started the chain.
                  </p>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <div className="h-px w-8 bg-[linear-gradient(90deg,rgba(255,207,139,0.08),rgba(255,207,139,0.85),rgba(255,207,139,0.08))]" />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    Sally
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    First-tier referral
                  </p>
                  <p className="mt-2 text-base leading-7 text-white/74">
                    She referred the person who won.
                  </p>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <div className="h-px w-8 bg-[linear-gradient(90deg,rgba(255,207,139,0.08),rgba(255,207,139,0.85),rgba(255,207,139,0.08))]" />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-[#ffcf8b]/12 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf8b]">
                    Jim
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Grand prize winner
                  </p>
                  <p className="mt-2 text-base leading-7 text-white/74">
                    His win can trigger the matching winners above him.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="animate-rise-in rounded-[2rem] border border-[#ffcf8b]/18 bg-[#fff7ee] p-6 text-[#23140d] shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
              style={{ animationDelay: "220ms" }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ab6731]">
                What happens next
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">
                Entry is just the front door.
              </h2>
              <div className="mt-5 space-y-4">
                {nextSteps.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0dd] text-[#ab6731]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ab6731]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-base leading-7 text-[#5e483a]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-[#e6d8ca] bg-[#f5efe7]"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#ab6731]">
                Campaign rhythm
              </p>
              <h2
                className={`max-w-xl text-balance text-4xl leading-tight text-[#1f1510] sm:text-5xl ${display.className}`}
              >
                Start as a member, then turn one nomination into a referral
                chain and a merchant spotlight.
              </h2>
              <p className="max-w-lg text-lg leading-8 text-[#645347]">
                The campaign works best when people can understand it in four
                beats: join, nominate, share, and champion a local merchant.
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
                      <span
                        className={`text-4xl leading-none text-[#ab6731] sm:text-5xl ${display.className}`}
                      >
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
                        <h3 className="text-2xl font-semibold text-[#1f1510]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="max-w-2xl text-base leading-8 text-[#645347]">
                        {step.description}
                      </p>
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
              <h2
                className={`max-w-xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}
              >
                See how one winning entry can create a chain reaction.
              </h2>
              <p className="max-w-xl text-lg leading-8 text-white/76">
                If the referral chain makes sense in a glance, it is easier to
                share, easier to explain, and easier to join.
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
                      <div className="rounded-[1.5rem] border border-white/12 bg-black/14 px-5 py-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                          {person.name}
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">
                          {person.label}
                        </h3>
                        <p className="mt-3 text-base leading-7 text-white/72">
                          {person.note}
                        </p>
                      </div>

                      {index < 2 && (
                        <div className="hidden h-px bg-[linear-gradient(90deg,rgba(255,207,139,0.15),rgba(255,207,139,0.8),rgba(255,207,139,0.15))] lg:block" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-lg leading-8 text-white/78">
                    One winning entry can create three winners from the same
                    referral chain. That is the hook people remember.
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
                    After account setup
                  </p>
                  <h2
                    className={`max-w-2xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}
                  >
                    "Who is your favorite merchant and why?"
                  </h2>
                  <p className="max-w-2xl text-lg leading-8 text-white/76">
                    That single question connects the sweepstakes to real local
                    businesses, member stories, and the approval-based reward
                    path.
                  </p>
                </div>

                <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
                  <div>
                    <MailCheck className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Finish setup once
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      Use the first email link to finish account setup and open
                      the dashboard. Your first nomination there locks in the
                      cycle entry.
                    </p>
                  </div>
                  <div>
                    <Camera className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Bring proof
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      A short story and two photos make the nomination feel
                      lived-in and worth publishing.
                    </p>
                  </div>
                  <div>
                    <Gift className="h-5 w-5 text-[#ffcf8b]" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf8b]">
                      Qualify after approval
                    </p>
                    <p className="mt-2 text-base leading-7 text-white/72">
                      Approval starts the $25 reward path. Store selection and
                      qualification still happen after that.
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
                    <h3 className="text-2xl font-semibold text-[#1f1510]">
                      {item.title}
                    </h3>
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
                  Members can submit up to five favorite-merchant nominations
                  per calendar month, and approved posts appear in a dedicated
                  merchant-page section called{" "}
                  <span className="font-semibold">
                    Nominated As A Favorite Merchant
                  </span>
                  .
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
              <h2
                className={`max-w-2xl text-balance text-4xl leading-tight sm:text-5xl ${display.className}`}
              >
                Show the kinds of merchants people will want to champion.
              </h2>
            </div>
            <p className="max-w-lg text-base leading-8 text-white/74">
              The sweepstakes lands better when it feels connected to real
              businesses people already know, use, and want to support.
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
                Start as a member
              </p>
              <h2
                className={`max-w-2xl text-balance text-4xl leading-tight text-[#1f1510] sm:text-5xl ${display.className}`}
              >
                Create your account, then come back with a merchant story.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-[#645347]">
                This page starts the membership. The sweepstakes entry happens
                when a member submits a favorite merchant nomination.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="h-12 rounded-full px-7">
                <a href="#entry-form">
                  Create your member account
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
                  See nomination flow
                  <ShieldCheck className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <TopMarketsFooter showSweepstakesPromo={false} />
    </div>
  );
}
