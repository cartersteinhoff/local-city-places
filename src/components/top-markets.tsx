import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

const markets = [
  {
    name: "Chandler",
    state: "AZ",
    url: "https://chandlercityzine.com",
    logo: "/images/ChandlerCityZine-Logo.png",
  },
  {
    name: "Phoenix",
    state: "AZ",
    url: "https://phoenixcityzine.com",
    logo: "/images/PhoenixCityZine-Logo.png",
  },
];

interface TopMarketsFooterProps {
  showSweepstakesPromo?: boolean;
}

export function TopMarketsFooter({
  showSweepstakesPromo = true,
}: TopMarketsFooterProps) {
  return (
    <div className="relative z-10 mt-auto">
      {showSweepstakesPromo && (
        <section className="border-t border-border bg-[linear-gradient(135deg,#1a120d_0%,#2c1a10_48%,#120b08_100%)] px-4 py-10 text-white">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.22)] lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffcf8b]">
                Favorite Merchant Sweepstakes
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                Enter to win $500 in gas or groceries and start building your
                referral chain.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/76">
                First-time entrants finish account setup by email. After that,
                daily entries and referrals happen from the member dashboard.
              </p>
            </div>

            <div className="flex items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[#ffcf8b] px-7 text-[#1b100b] hover:bg-[#ffd9a7]"
              >
                <Link href="/favorite-merchant-sweepstakes">
                  Explore the Sweepstakes
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Top Markets */}
      <section className="bg-muted/80 dark:bg-zinc-900/90 backdrop-blur-md border-t border-border pt-8 pb-6 px-4">
        <h2 className="text-center text-lg font-bold uppercase tracking-[0.15em] text-foreground/70 mb-6">
          Top Markets
        </h2>
        <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
          {markets.map((market) => (
            <a
              key={market.name}
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <div className="rounded-lg bg-card p-3 shadow-sm border border-border transition-shadow group-hover:shadow-md">
                <Image
                  src={market.logo}
                  alt={`${market.name} City Zine`}
                  width={200}
                  height={64}
                  className="h-auto w-[160px] sm:w-[200px]"
                />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {market.name}, {market.state}
              </span>
            </a>
          ))}
        </div>
      </section>
      <Footer variant="light" />
    </div>
  );
}
