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

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="rounded-2xl bg-white/90 dark:bg-card/95 backdrop-blur-sm p-8 md:p-12 shadow-xl dark:border">
          <Image
            src="/images/logo-horizontal.png"
            alt="Local City Places"
            width={400}
            height={100}
            priority
            className="mb-8"
          />

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
          </div>
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
