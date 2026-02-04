"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { formatPhoneNumber } from "@/lib/utils";
import { MerchantForm, type FormData, INITIAL_FORM_DATA } from "../../_components/merchant-form";

interface Category {
  id: string;
  name: string;
}

export default function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [initialData, setInitialData] = useState<FormData>(INITIAL_FORM_DATA);
  const [initialUrls, setInitialUrls] = useState<{ full: string | null; short: string | null }>({ full: null, short: null });
  const [initialCategoryName, setInitialCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

  // Fetch merchant data
  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch(`/api/admin/merchant-pages/${id}`);
        if (res.ok) {
          const data = await res.json();
          const m = data.merchant;

          const loadedData: FormData = {
            businessName: m.businessName || "",
            categoryId: m.categoryId || "",
            description: m.description || "",
            aboutStory: m.aboutStory || "",
            googlePlaceId: m.googlePlaceId || "",
            streetAddress: m.streetAddress || "",
            city: m.city || "",
            state: m.state || "",
            zipCode: m.zipCode || "",
            phone: formatPhoneNumber(m.phone || ""),
            website: m.website || "",
            instagramUrl: m.instagramUrl || "",
            facebookUrl: m.facebookUrl || "",
            tiktokUrl: m.tiktokUrl || "",
            hours: m.hours || {},
            logoUrl: m.logoUrl || "",
            vimeoUrl: m.vimeoUrl || "",
            photos: m.photos || [],
            services: (m.services || []).map((s: { name: string; description?: string; price?: string }, i: number) => ({
              ...s,
              id: `service-${i}-${Date.now()}`,
            })),
            slug: m.slug || "",
          };

          setInitialData(loadedData);
          setInitialUrls(m.urls);
          setInitialCategoryName(m.categoryName || "");
        } else {
          setError("Merchant not found");
        }
      } catch (err) {
        console.error("Error fetching merchant:", err);
        setError("Failed to load merchant");
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
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/admin/merchants">Back to Merchant Pages</Link>
          </Button>
        </div>
      ) : (
        <MerchantForm
          mode="edit"
          merchantId={id}
          initialData={initialData}
          initialUrls={initialUrls}
          initialCategoryName={initialCategoryName}
          categories={categories}
        />
      )}
    </DashboardLayout>
  );
}
