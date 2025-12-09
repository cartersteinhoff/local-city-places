import Link from "next/link"

export function Footer() {
  return (
    <footer className="text-muted-foreground py-6 text-center text-sm">
      <p>&copy; {new Date().getFullYear()} Local City Places</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link href="/contact" className="hover:text-foreground transition-colors">
          Contact
        </Link>
      </div>
    </footer>
  )
}
