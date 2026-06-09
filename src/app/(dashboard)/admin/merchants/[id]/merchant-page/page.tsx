"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  type MerchantPageManagementData,
  type MerchantPageManagementMerchant,
  MerchantPageManagementPanel,
} from "@/components/merchant/merchant-page-management-panel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";

interface AdminMerchantPageResponse {
  merchant: MerchantPageManagementMerchant & {
    urls: {
      full: string | null;
      short: string | null;
    };
    photos?: string[] | null;
  };
  pageManagement: MerchantPageManagementData;
}

export default function AdminMerchantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [data, setData] = useState<AdminMerchantPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    async function fetchMerchantPage() {
      try {
        const res = await fetch(`/api/admin/merchant-pages/${id}`);
        if (!res.ok) {
          setError("Merchant page not found");
          return;
        }

        const responseData = await res.json();
        const merchant = responseData.merchant;

        setData({
          merchant: {
            id: merchant.id,
            businessName: merchant.businessName,
            categoryId: merchant.categoryId,
            categoryName: merchant.categoryName,
            isPublicPage: merchant.isPublicPage,
            verified: merchant.verified,
            city: merchant.city,
            state: merchant.state,
            slug: merchant.slug,
            logoUrl: merchant.logoUrl,
            description: merchant.description,
            phone: merchant.phone,
            website: merchant.website,
            photoCount: merchant.photos?.length || 0,
            updatedAt: merchant.updatedAt,
            urls: merchant.urls,
            photos: merchant.photos,
          },
          pageManagement: responseData.pageManagement,
        });
      } catch (err) {
        console.error("Error fetching merchant page:", err);
        setError("Failed to load merchant page");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && isAuthenticated && id) {
      fetchMerchantPage();
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
          <Button variant="outline" asChild>
            <Link href="/admin/merchants">Back to Merchant Pages</Link>
          </Button>
        </div>
      ) : data ? (
        <>
          <PageHeader
            title="Merchant Page"
            description={`Admin view for ${data.merchant.businessName}`}
            actions={
              <Button variant="outline" asChild>
                <Link href="/admin/merchants">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Merchant Pages
                </Link>
              </Button>
            }
          />

          <MerchantPageManagementPanel
            merchant={data.merchant}
            pageManagement={data.pageManagement}
            publicPageHref={data.merchant.urls.full}
            editHref={`/admin/merchants/${id}/edit`}
            editLabel="Edit Merchant Page"
            summaryLabel="Merchant Page for"
          />
        </>
      ) : null}
    </DashboardLayout>
  );
}
