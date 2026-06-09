"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  type MerchantPageManagementData,
  type MerchantPageManagementMerchant,
  MerchantPageManagementPanel,
} from "@/components/merchant/merchant-page-management-panel";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { getMerchantPageUrl } from "@/lib/utils";
import { merchantNavItems } from "../nav";

interface MerchantPageData {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
}

export default function MerchantPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [pageData, setPageData] = useState<MerchantPageData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

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
            setPageData({
              merchant: data.merchant,
              pageManagement: data.pageManagement,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to load merchant page data:", error);
        })
        .finally(() => setDataLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const merchant = pageData?.merchant;
  const publicPageHref =
    merchant?.city && merchant.state && merchant.slug
      ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
      : null;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Page"
            description="Manage the public page customers see for your business"
          />

          {pageData && (
            <MerchantPageManagementPanel
              merchant={pageData.merchant}
              pageManagement={pageData.pageManagement}
              publicPageHref={publicPageHref}
              editHref="/merchant/profile"
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
