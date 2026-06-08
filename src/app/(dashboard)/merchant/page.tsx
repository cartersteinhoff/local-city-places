"use client";

import {
  ExternalLink,
  Loader2,
  RadioTower,
  Star,
  Store,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useUser } from "@/hooks/use-user";
import { merchantNavItems } from "./nav";

interface DashboardData {
  merchant: {
    id: string;
    businessName: string;
    isPublicPage: boolean | null;
    verified: boolean;
    city: string | null;
    state: string | null;
    slug: string | null;
  };
  stats: {
    totalReviews: number;
    avgWordCount: number;
  };
  recentReviews: Array<{
    id: string;
    content: string;
    wordCount: number;
    createdAt: string;
  }>;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
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
            setDashboardData(data);
          }
        })
        .catch((error) => {
          console.error("Failed to load dashboard data:", error);
        })
        .finally(() => setDataLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const publicPageHref =
    dashboardData?.merchant.city &&
    dashboardData.merchant.state &&
    dashboardData.merchant.slug
      ? `/business/${dashboardData.merchant.city.toLowerCase()}/${dashboardData.merchant.state.toLowerCase()}/${dashboardData.merchant.slug}`
      : null;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading || dataLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Merchant Dashboard"
            description="Manage your business profile, campaign media, and customer reviews"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard
              label="Reviews"
              value={dashboardData?.stats.totalReviews ?? 0}
              icon={Star}
            />
            <StatCard
              label="Avg. Words"
              value={dashboardData?.stats.avgWordCount ?? 0}
              icon={Star}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <a
                  href="/merchant/on-air-studio"
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <RadioTower className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">On-Air Studio</p>
                    <p className="text-xs text-muted-foreground">
                      Hear campaign media
                    </p>
                  </div>
                </a>
                <a
                  href="/merchant/reviews"
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <Star className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Reviews</p>
                    <p className="text-xs text-muted-foreground">
                      Read customer feedback
                    </p>
                  </div>
                </a>
                <a
                  href="/merchant/profile"
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <UserCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Profile</p>
                    <p className="text-xs text-muted-foreground">
                      Update business details
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {dashboardData?.merchant.businessName || "Business Profile"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData?.merchant.verified
                      ? "Verified"
                      : "Not verified"}
                  </p>
                </div>
              </div>
              {publicPageHref && (
                <a
                  href={publicPageHref}
                  className="mt-4 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
            {dashboardData?.recentReviews.length ? (
              <div className="space-y-4">
                {dashboardData.recentReviews.map((review) => (
                  <div key={review.id} className="rounded-lg border p-4">
                    <p className="line-clamp-3 text-sm leading-6">
                      {review.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {review.wordCount} words ·{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
