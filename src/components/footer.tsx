import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("py-6 text-center text-sm", className)}>
      <div className="inline-block rounded-lg bg-black/20 px-6 py-3 backdrop-blur-sm">
        <p className="text-white font-medium">
          &copy; 2026 LOCAL City Places&trade; LLC - All Rights Reserved
        </p>
        <p className="text-white font-medium">
          Powered by CityPressMedia.Com, INC.
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link
            href="/privacy"
            className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="https://ClaimMyGRC.Com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            ClaimMyGRC for Customers
          </Link>
          <Link
            href="https://GRCRebates.Com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            GRC Rebates for Business
          </Link>
        </div>
      </div>
    </footer>
  );
}
