"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../nav";
import { MerchantForm } from "../_components/merchant-form";

interface Category {
  id: string;
  name: string;
}

export default function CreateMerchantPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);

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

  const handleSuccess = (data: { id: string }) => {
    router.push(`/admin/merchants/${data.id}/edit`);
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <MerchantForm
          mode="create"
          categories={categories}
          onSuccess={handleSuccess}
        />
      )}
    </DashboardLayout>
  );
}
