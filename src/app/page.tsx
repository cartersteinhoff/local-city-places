"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { Footer } from "@/components/footer"
import { AnimatedFoodBackground } from "@/components/animated-food-background"

type LoginType = "member" | "merchant"

export default function Home() {
  const [loginModal, setLoginModal] = useState<{
    open: boolean
    type: LoginType
  }>({ open: false, type: "member" })

  const openLogin = (type: LoginType) => {
    setLoginModal({ open: true, type })
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedFoodBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 md:p-12 shadow-xl">
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
              onClick={() => openLogin("member")}
            >
              GRC Member Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full bg-white/80 hover:bg-white"
              onClick={() => openLogin("merchant")}
            >
              Merchant Login
            </Button>
          </div>
        </div>
      </main>

      <Footer className="relative z-10" />

      <LoginModal
        type={loginModal.type}
        open={loginModal.open}
        onOpenChange={(open) => setLoginModal((prev) => ({ ...prev, open }))}
      />
    </div>
  )
}
