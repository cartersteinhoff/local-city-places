import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("py-6 text-center text-sm", className)}>
      <div className="inline-block rounded-lg bg-black/20 px-6 py-3 backdrop-blur-sm">
        <p className="text-white font-medium">&copy; {new Date().getFullYear()} Local City Places</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline">
            Terms
          </Link>
          <Link href="/contact" className="text-white/90 hover:text-white transition-colors underline-offset-2 hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
