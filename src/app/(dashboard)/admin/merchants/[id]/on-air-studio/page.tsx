"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { OnAirStudioContent } from "@/components/on-air-studio-content";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";

interface MerchantData {
  businessName: string;
  campaignAudio?: React.ComponentProps<
    typeof OnAirStudioContent
  >["campaignAudio"];
  urls: {
    full: string | null;
  };
}

export default function AdminMerchantOnAirStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch(`/api/admin/merchant-pages/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load merchant");
        }

        setMerchant(data.merchant);
      } catch (err) {
        console.error("Error fetching merchant:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load merchant",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && isAuthenticated && id) {
      fetchMerchant();
    }
  }, [authLoading, isAuthenticated, id]);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/merchants")}
          >
            Back to Merchant Pages
          </Button>
        </div>
      ) : (
        <OnAirStudioContent
          mode="admin"
          merchantName={merchant?.businessName}
          campaignAudio={merchant?.campaignAudio}
          publicPageHref={merchant?.urls.full}
          backHref={`/admin/merchants/${id}/edit`}
        />
      )}
    </DashboardLayout>
  );
}
