"use client"

import { useState } from "react"
import Image from "next/image"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { TopMarketsFooter } from "@/components/top-markets"
import { FeaturedMarquee } from "@/components/featured-marquee"
import { AnimatedFoodBackground } from "@/components/animated-food-background"

export function HomeClient() {
  const [loginOpen, setLoginOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedFoodBackground />

      {/* Header */}
      <header className="relative z-10">
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <Image
              src="/images/logo-horizontal.png"
              alt="Local City Places"
              width={650}
              height={286}
              className="h-10 sm:h-12 w-auto"
              priority
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-white text-zinc-900 font-semibold hover:bg-white/90 shadow-lg px-6"
                onClick={() => setLoginOpen(true)}
              >
                Login
              </Button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative p-2 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Toggle theme"
              >
                <Sun className="w-5 h-5 text-white rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute top-2 left-2 w-5 h-5 text-white rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to push content down */}
      <div className="flex-1" />

      <FeaturedMarquee />

      <TopMarketsFooter />

      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
      />
    </div>
  )
}
