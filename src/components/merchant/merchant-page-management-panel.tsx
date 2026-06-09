"use client";

import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FileText,
  Globe2,
  ImageIcon,
  type LucideIcon,
  MapPin,
  Tag,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPhoneNumber } from "@/lib/utils";

export interface MerchantPageManagementMerchant {
  id: string;
  businessName: string;
  categoryId: string | null;
  categoryName: string | null;
  isPublicPage: boolean | null;
  verified: boolean;
  city: string | null;
  state: string | null;
  slug: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  photoCount: number;
  updatedAt: string;
}

export interface MerchantPageManagementData {
  completionPercentage: number;
  completedFields: number;
  totalFields: number;
  missingSections: Array<{
    label: string;
    missingFields: string[];
  }>;
}

interface MerchantPageManagementPanelProps {
  merchant: MerchantPageManagementMerchant;
  pageManagement: MerchantPageManagementData;
  publicPageHref: string | null;
  editHref: string;
  className?: string;
  editLabel?: string;
  summaryLabel?: string;
}

export function MerchantPageManagementPanel({
  merchant,
  pageManagement,
  publicPageHref,
  editHref,
  className,
  editLabel = "Edit Page Details",
  summaryLabel = "Merchant Page Management for",
}: MerchantPageManagementPanelProps) {
  const categoryName = merchant.categoryName || "Category not selected";
  const locationLabel = [merchant.city, merchant.state]
    .filter(Boolean)
    .join(", ");
  const completionPercentage = pageManagement.completionPercentage ?? 0;
  const lastUpdatedLabel = merchant.updatedAt
    ? new Date(merchant.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";
  const pageDetails: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    complete: boolean;
  }> = [
    {
      label: "Location",
      value: locationLabel || "Missing",
      icon: MapPin,
      complete: !!locationLabel,
    },
    {
      label: "Description",
      value: merchant.description ? "Ready" : "Missing",
      icon: FileText,
      complete: !!merchant.description,
    },
    {
      label: "Website",
      value: merchant.website || "Missing",
      icon: Globe2,
      complete: !!merchant.website,
    },
    {
      label: "Photos",
      value: `${merchant.photoCount ?? 0} added`,
      icon: ImageIcon,
      complete: (merchant.photoCount ?? 0) > 0 || !!merchant.logoUrl,
    },
  ];

  return (
    <section
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
    >
      <div className="border-b bg-muted/30 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Chosen category
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Tag className="h-5 w-5 shrink-0 text-primary" />
                <h2 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {categoryName}
                </h2>
              </div>
              <Badge
                variant={merchant.categoryName ? "secondary" : "outline"}
                className="px-3 py-1"
              >
                {merchant.categoryName ? "Selected" : "Needs selection"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {summaryLabel}{" "}
              <span className="font-medium text-foreground">
                {merchant.businessName || "Business Profile"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={editHref}>
                <UserCircle className="h-4 w-4" />
                {editLabel}
              </Link>
            </Button>
            {publicPageHref && (
              <Button asChild>
                <Link href={publicPageHref}>
                  <ExternalLink className="h-4 w-4" />
                  View Public Page
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid divide-y md:grid-cols-[0.9fr_1.1fr_1fr] md:divide-x md:divide-y-0">
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Page completion</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {lastUpdatedLabel}
              </p>
            </div>
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
              }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {pageManagement.completedFields ?? 0} of{" "}
            {pageManagement.totalFields ?? 0} page essentials complete
          </p>
        </div>

        <div className="p-5 md:p-6">
          <p className="text-sm font-medium">Current page details</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pageDetails.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex min-w-0 gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {item.label === "Website" && item.complete
                        ? item.value.replace(/^https?:\/\//, "")
                        : item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {merchant.phone && (
            <p className="mt-4 text-xs text-muted-foreground">
              Phone: {formatPhoneNumber(merchant.phone)}
            </p>
          )}
        </div>

        <div className="p-5 md:p-6">
          <p className="text-sm font-medium">Maintenance queue</p>
          {pageManagement.missingSections.length ? (
            <div className="mt-4 space-y-3">
              {pageManagement.missingSections.map((section) => (
                <div key={section.label} className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Add {section.missingFields.slice(0, 2).join(", ")}
                      {section.missingFields.length > 2 ? "..." : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-medium">No immediate gaps</p>
                <p className="text-xs text-muted-foreground">
                  Core merchant page fields are complete.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
