"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Gift, ShoppingCart } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";

export default function IssueGrcPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Purchase GRCs to Get Started</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Grocery Rebate Certificates (GRCs) reward your customers with real savings on their grocery purchases. Issue GRCs to drive repeat visits, collect valuable customer feedback, and build loyalty.
          </p>
          <a
            href="/merchant/purchase"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Purchase GRCs
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}
