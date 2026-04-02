import { redirect } from "next/navigation";
import { FavoriteMerchantLandingPage } from "@/components/campaigns/favorite-merchant/landing-page";
import { getRedirectPath, getSession } from "@/lib/auth";

export default async function FavoriteMerchantSweepstakesPage() {
  const session = await getSession();

  if (session) {
    const hasProfile =
      session.user.role === "admin"
        ? true
        : session.user.role === "member"
          ? !!session.member
          : !!session.merchant;

    if (
      (session.user.role === "member" && session.member) ||
      (session.user.role === "admin" && session.member)
    ) {
      redirect("/member?sweepstakes=dashboard");
    }

    redirect(getRedirectPath(session.user.role, hasProfile));
  }

  return <FavoriteMerchantLandingPage />;
}
