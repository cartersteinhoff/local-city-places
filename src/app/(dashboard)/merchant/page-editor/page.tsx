"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { formatPhoneNumber } from "@/lib/utils";
import {
  type FormData,
  INITIAL_FORM_DATA,
  MerchantForm,
} from "../../admin/merchants/_components/merchant-form";
import { merchantNavItems } from "../nav";

interface Category {
  id: string;
  name: string;
}

interface MerchantPagePayload {
  id: string;
  businessName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  aboutStory: string | null;
  googlePlaceId: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  hours: FormData["hours"] | null;
  logoUrl: string | null;
  vimeoUrl: string | null;
  photos: string[] | null;
  services: Array<{
    name: string;
    description?: string;
    price?: string;
  }> | null;
  campaignAudio: FormData["campaignAudio"];
  slug: string | null;
  featuredOnHomepage: boolean | null;
  isPublicPage: boolean | null;
  urls: { full: string | null; short: string | null };
}

function mapMerchantToFormData(merchant: MerchantPagePayload): FormData {
  return {
    businessName: merchant.businessName || "",
    categoryId: merchant.categoryId || "",
    description: merchant.description || "",
    aboutStory: merchant.aboutStory || "",
    googlePlaceId: merchant.googlePlaceId || "",
    streetAddress: merchant.streetAddress || "",
    city: merchant.city || "",
    state: merchant.state || "",
    zipCode: merchant.zipCode || "",
    phone: formatPhoneNumber(merchant.phone || ""),
    website: merchant.website || "",
    instagramUrl: merchant.instagramUrl || "",
    facebookUrl: merchant.facebookUrl || "",
    tiktokUrl: merchant.tiktokUrl || "",
    hours: merchant.hours || {},
    logoUrl: merchant.logoUrl || "",
    vimeoUrl: merchant.vimeoUrl || "",
    photos: merchant.photos || [],
    services: (merchant.services || []).map((service, index) => ({
      ...service,
      id: `service-${index}-${Date.now()}`,
    })),
    campaignAudio: merchant.campaignAudio || null,
    slug: merchant.slug || "",
    featuredOnHomepage: Boolean(merchant.featuredOnHomepage),
    isPublicPage: Boolean(merchant.isPublicPage),
  };
}

export default function MerchantPageEditor() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [initialData, setInitialData] = useState<FormData>(INITIAL_FORM_DATA);
  const [initialUrls, setInitialUrls] = useState<{
    full: string | null;
    short: string | null;
  }>({ full: null, short: null });
  const [initialCategoryName, setInitialCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (
      authLoading ||
      !isAuthenticated ||
      (user?.role !== "merchant" && user?.role !== "admin")
    ) {
      return;
    }

    async function fetchEditorData() {
      setIsLoading(true);
      setError("");

      try {
        const [categoriesRes, merchantRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/merchant/page"),
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        const merchantData = await merchantRes.json();
        if (!merchantRes.ok) {
          throw new Error(
            merchantData.error || "Failed to load merchant page editor",
          );
        }

        const merchant = merchantData.merchant as MerchantPagePayload;
        setMerchantId(merchant.id);
        setInitialData(mapMerchantToFormData(merchant));
        setInitialUrls(merchant.urls || { full: null, short: null });
        setInitialCategoryName(merchant.categoryName || "");
      } catch (err) {
        console.error("Error loading merchant page editor:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load merchant page editor",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchEditorData();
  }, [authLoading, isAuthenticated, user?.role]);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-lg py-12 text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/merchant">Back to Dashboard</Link>
          </Button>
        </div>
      ) : (
        <MerchantForm
          mode="edit"
          surface="merchant"
          merchantId={merchantId}
          initialData={initialData}
          initialUrls={initialUrls}
          initialCategoryName={initialCategoryName}
          categories={categories}
        />
      )}
    </DashboardLayout>
  );
}
