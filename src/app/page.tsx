import { redirect } from "next/navigation"
import { getSession, getRedirectPath } from "@/lib/auth"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const session = await getSession()

  // If logged in, redirect to appropriate dashboard
  if (session) {
    const hasProfile = session.user.role === "admin" || !!session.member || !!session.merchant
    redirect(getRedirectPath(session.user.role, hasProfile))
  }

  return <HomeClient />
}
