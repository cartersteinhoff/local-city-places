"use client";

import {
  ArrowUpRight,
  FileText,
  Gift,
  Home,
  Loader2,
  Megaphone,
  ShieldCheck,
  Store,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";

const sitePages = [
  {
    label: "Home",
    href: "/",
    description: "Main public homepage.",
    icon: Home,
  },
  {
    label: "Request Category",
    href: "/request",
    description: "Phoenix Metro category request page.",
    icon: Tags,
  },
  {
    label: "Favorite Merchant Sweepstakes",
    href: "/favorite-merchant-sweepstakes",
    description: "Public sweepstakes landing page.",
    icon: Gift,
  },
  {
    label: "MarketLOCK360",
    href: "/marketlock360",
    description: "Pricing and local growth plan page.",
    icon: Megaphone,
  },
  {
    label: "Merchant Template",
    href: "/merchantpage",
    description: "Public merchant page lookup/template route.",
    icon: Store,
  },
] as const;

const legalPages = [
  {
    label: "Privacy Policy",
    href: "/privacy",
    description: "Public privacy policy.",
    icon: ShieldCheck,
  },
  {
    label: "Terms of Service",
    href: "/terms",
    description: "Public terms page.",
    icon: FileText,
  },
] as const;

function PageLinkList({
  title,
  pages,
}: {
  title: string;
  pages: readonly {
    label: string;
    href: string;
    description: string;
    icon: typeof Home;
  }[];
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y">
        {pages.map(({ label, href, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/60 sm:px-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">{label}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {description}
              </span>
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AdminPagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Public Pages"
            description="Open public pages from the admin dashboard."
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <PageLinkList title="Site Pages" pages={sitePages} />
            <PageLinkList title="Legal Pages" pages={legalPages} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
