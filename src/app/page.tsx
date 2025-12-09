"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { Footer } from "@/components/footer"

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
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <Image
          src="/images/logo-horizontal.png"
          alt="Local City Places"
          width={400}
          height={100}
          priority
          className="mb-12"
        />

        <div className="flex flex-col gap-4 w-full max-w-xs">
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
            className="w-full"
            onClick={() => openLogin("merchant")}
          >
            Merchant Login
          </Button>
        </div>
      </main>

      <Footer />

      <LoginModal
        type={loginModal.type}
        open={loginModal.open}
        onOpenChange={(open) => setLoginModal((prev) => ({ ...prev, open }))}
      />
    </div>
  )
}
