"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { Footer } from "@/components/footer"
import { AnimatedFoodBackground } from "@/components/animated-food-background"

export function HomeClient() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedFoodBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center">
          <Image
            src="/images/lcp-growth-engine.png"
            alt="The Engine Powering Local Commerce - Six Growth Engines"
            width={500}
            height={500}
            className="max-w-[370px] md:max-w-[550px] drop-shadow-2xl mb-0"
          />

          <Button
            size="lg"
            className="py-3 text-base w-full max-w-xs"
            onClick={() => setLoginOpen(true)}
          >
            Login
          </Button>
        </div>
      </main>

      <Footer className="relative z-10" />

      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
      />
    </div>
  )
}
