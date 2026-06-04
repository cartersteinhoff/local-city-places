import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  variant?: "overlay" | "light" | "dark";
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
  dark: {
    footer:
      "relative z-10 bg-black border-t border-white/10 px-4 py-5 text-white sm:px-6",
    inner: "mx-auto flex max-w-6xl flex-col items-center gap-2 text-center",
    primaryText: "text-xs font-medium text-white/75",
    secondaryText: "mt-1 text-xs text-white/45",
    link: "text-xs font-medium text-white/55 transition-colors hover:text-orange-400",
  },
} as const;

export function Footer({ className, variant = "overlay" }: FooterProps) {
  const styles = footerVariants[variant];
  const content = (
    <>
      <div>
        <p className={styles.primaryText}>
          &copy; 2026 LOCAL City Places&trade; LLC - All Rights Reserved
        </p>
      </div>
      <div
        className={cn(
          "flex flex-wrap justify-center gap-x-4 gap-y-1",
          variant === "dark" ? "mt-0" : "mt-2",
        )}
      >
        <Link href="/privacy" className={styles.link}>
          Privacy Policy
        </Link>
        <Link href="/terms" className={styles.link}>
          Terms &amp; Conditions
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
