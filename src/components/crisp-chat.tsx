"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/use-user"

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export default function CrispChat() {
  const pathname = usePathname()
  const { user, userName } = useUser()
  const userEmail = user?.email || null

  useEffect(() => {
    // Show Crisp on dashboard pages (member, merchant, admin)
    const isDashboardPage =
      pathname.startsWith("/member") ||
      pathname.startsWith("/merchant") ||
      pathname.startsWith("/admin")

    if (!isDashboardPage) {
      // Hide Crisp if it's loaded but we're not on a dashboard page
      if (window.$crisp) {
        window.$crisp.push(["do", "chat:hide"])
      }
      return
    }

    // Initialize Crisp
    window.$crisp = window.$crisp || []
    window.CRISP_WEBSITE_ID = "21060e4b-6619-41e1-a5c9-82f527807abf"

    // Set user email and name if available
    if (userEmail) {
      window.$crisp.push(["set", "user:email", [userEmail]])
    }
    if (userName) {
      window.$crisp.push(["set", "user:nickname", [userName]])
    }

    // Check if Crisp is already loaded
    const existingScript = document.getElementById("crisp-script")
    if (existingScript) {
      // Show Crisp since we're on a dashboard page
      window.$crisp.push(["do", "chat:show"])
      // Update user data if script already exists
      if (userEmail) {
        window.$crisp.push(["set", "user:email", [userEmail]])
      }
      if (userName) {
        window.$crisp.push(["set", "user:nickname", [userName]])
      }
      return
    }

    // Load Crisp script
    const script = document.createElement("script")
    script.id = "crisp-script"
    script.src = "https://client.crisp.chat/l.js"
    script.async = true
    document.head.appendChild(script)

    // Set user data after script loads
    script.onload = () => {
      if (userEmail) {
        window.$crisp.push(["set", "user:email", [userEmail]])
      }
      if (userName) {
        window.$crisp.push(["set", "user:nickname", [userName]])
      }
    }

    // Cleanup function
    return () => {
      // Hide the chat when navigating away from dashboard
      if (window.$crisp && !isDashboardPage) {
        window.$crisp.push(["do", "chat:hide"])
      }
    }
  }, [pathname, userEmail, userName])

  return null
}
