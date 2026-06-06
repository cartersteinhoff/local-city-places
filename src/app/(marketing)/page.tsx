import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home-client";
import { getRedirectPath, getSession } from "@/lib/auth";
import { getFeaturedMerchants } from "@/lib/featured-merchants";

export default async function Home() {
  const session = await getSession();

  // If logged in, redirect to appropriate dashboard
  if (session) {
    const hasProfile =
      session.user.role === "admin" || !!session.member || !!session.merchant;
    redirect(getRedirectPath(session.user.role, hasProfile));
  }

  const featuredMerchants = await getFeaturedMerchants();

  return <HomeClient featuredMerchants={featuredMerchants} />;
}
