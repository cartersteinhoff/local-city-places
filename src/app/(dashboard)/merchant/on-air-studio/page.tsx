"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { OnAirStudioContent } from "@/components/on-air-studio-content";
import { useUser } from "@/hooks/use-user";
import { merchantNavItems } from "../nav";

interface MerchantSummary {
  businessName: string;
  isPublicPage: boolean | null;
  city: string | null;
  state: string | null;
  slug: string | null;
  campaignAudio?: React.ComponentProps<
    typeof OnAirStudioContent
  >["campaignAudio"];
}

export default function MerchantOnAirStudioPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [merchant, setMerchant] = useState<MerchantSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated ||
        (user?.role !== "merchant" && user?.role !== "admin"))
    ) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetch("/api/merchant/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setMerchant(data.merchant);
          }
        })
        .catch((error) => {
          console.error("Failed to load merchant summary:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const publicPageHref =
    merchant?.isPublicPage && merchant.city && merchant.state && merchant.slug
      ? `/business/${merchant.city.toLowerCase()}/${merchant.state.toLowerCase()}/${merchant.slug}`
      : null;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <OnAirStudioContent
          mode="merchant"
          merchantName={merchant?.businessName}
          campaignAudio={merchant?.campaignAudio}
          publicPageHref={publicPageHref}
        />
      )}
    </DashboardLayout>
  );
}
