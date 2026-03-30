"use client"

import { useEffect, useState } from "react"
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
  const { user, userName } = useUser()
  const userEmail = user?.email || null
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.$crisp = window.$crisp || []
      window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID
      setShouldLoad(true)
    }
  }, [])

  useEffect(() => {
    if (!window.$crisp) return

    window.$crisp.push(["do", "chat:show"])
    if (userEmail) {
      window.$crisp.push(["set", "user:email", [userEmail]])
    }
    if (userName) {
      window.$crisp.push(["set", "user:nickname", [userName]])
    }
  }, [userEmail, userName])

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
