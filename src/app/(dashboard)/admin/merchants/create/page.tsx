"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Copy, ExternalLink } from "lucide-react";
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
  const [isReady, setIsReady] = useState(false);
  const [success, setSuccess] = useState<{
    urls: { full: string; short: string };
    id: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Delay rendering to ensure hydration completes
  useEffect(() => {
    setIsReady(true);
  }, []);

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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${text}` : text;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  const handleSuccess = (data: { id: string; urls: { full: string; short: string } }) => {
    setSuccess({ id: data.id, urls: data.urls });
  };

  if (success) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Merchant Page Created!</h1>
            <p className="text-muted-foreground">
              The merchant page has been created successfully.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <Label className="text-sm text-muted-foreground">Short URL (for sharing)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
                  {getFullUrl(success.urls.short)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(success.urls.short, "short")}
                >
                  {copiedUrl === "short" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <Label className="text-sm text-muted-foreground">Full URL (SEO-friendly)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
                  {getFullUrl(success.urls.full)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(success.urls.full, "full")}
                >
                  {copiedUrl === "full" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/admin/merchants">
                Back to List
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href={`/admin/merchants/${success.id}/edit`}>
                Continue Editing
              </Link>
            </Button>
          </div>

          <div className="flex gap-3 mt-3">
            <Button variant="outline" className="flex-1" asChild>
              <a href={success.urls.full} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Page
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSuccess(null)}
            >
              Create Another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || !isReady ? (
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
