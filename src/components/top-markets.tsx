import Image from "next/image";
import Link from "next/link";

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

export function TopMarketsFooter() {
  return (
    <div className="relative z-10 mt-auto">
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
                  width={500}
                  height={160}
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

      {/* Footer */}
      <footer className="bg-zinc-100 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-5 text-center border-t border-border">
        <p className="text-xs text-foreground/70">
          &copy; 2026 LOCAL City Places&trade; LLC - All Rights Reserved
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Powered by CityPressMedia.Com, INC.
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="/contact"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
