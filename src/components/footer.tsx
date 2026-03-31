import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  variant?: "overlay" | "light";
}

const footerVariants = {
  overlay: {
    footer: "py-6 text-center text-sm",
    inner: "inline-block rounded-lg bg-black/20 px-6 py-3 backdrop-blur-sm",
    primaryText: "text-white font-medium",
    secondaryText: "text-white font-medium",
    link: "text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline",
  },
  light: {
    footer:
      "bg-zinc-100 dark:bg-zinc-950/95 border-t border-border px-4 py-5 text-center backdrop-blur-md",
    inner: "",
    primaryText: "text-xs text-foreground/70",
    secondaryText: "mt-0.5 text-xs text-muted-foreground",
    link: "text-xs text-muted-foreground transition-colors hover:text-foreground",
  },
} as const;

export function Footer({ className, variant = "overlay" }: FooterProps) {
  const styles = footerVariants[variant];
  const content = (
    <>
      <p className={styles.primaryText}>
        &copy; 2026 LOCAL City Places&trade; LLC - All Rights Reserved
      </p>
      <p className={styles.secondaryText}>
        Powered by CityPressMedia.Com, INC.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/privacy" className={styles.link}>
          Privacy Policy
        </Link>
        <Link href="/terms" className={styles.link}>
          Terms &amp; Conditions
        </Link>
        <Link
          href="https://ClaimMyGRC.Com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          ClaimMyGRC for Customers
        </Link>
        <Link
          href="https://GRCRebates.Com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          GRC Rebates for Business
        </Link>
      </div>
    </>
  );

  return (
    <footer className={cn(styles.footer, className)}>
      {styles.inner ? <div className={styles.inner}>{content}</div> : content}
    </footer>
  );
}
