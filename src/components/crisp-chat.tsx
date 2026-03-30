"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { useUser } from "@/hooks/use-user"

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

const CRISP_WEBSITE_ID = "21060e4b-6619-41e1-a5c9-82f527807abf"

export default function CrispChat() {
  const pathname = usePathname()

  const isDashboardPage =
    pathname.startsWith("/member") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/admin")

  const { user, userName } = useUser(isDashboardPage)
  const userEmail = user?.email || null
  const [shouldLoad, setShouldLoad] = useState(false)

  // Initialize Crisp globals only on dashboard pages
  useEffect(() => {
    if (isDashboardPage && typeof window !== "undefined") {
      window.$crisp = window.$crisp || []
      window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID
    }
  }, [isDashboardPage])

  // Load script on dashboard pages
  useEffect(() => {
    if (isDashboardPage) {
      setShouldLoad(true)
    }
  }, [isDashboardPage])

  // Handle visibility and user data
  useEffect(() => {
    if (!window.$crisp) return

    if (isDashboardPage) {
      window.$crisp.push(["do", "chat:show"])
      if (userEmail) {
        window.$crisp.push(["set", "user:email", [userEmail]])
      }
      if (userName) {
        window.$crisp.push(["set", "user:nickname", [userName]])
      }
    } else {
      window.$crisp.push(["do", "chat:hide"])
    }
  }, [isDashboardPage, userEmail, userName])

  if (!shouldLoad) return null

  return (
    <Script
      id="crisp-script"
      src="https://client.crisp.chat/l.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (userEmail) {
          window.$crisp.push(["set", "user:email", [userEmail]])
        }
        if (userName) {
          window.$crisp.push(["set", "user:nickname", [userName]])
        }
      }}
    />
  )
}
