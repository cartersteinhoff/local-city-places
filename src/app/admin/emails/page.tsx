"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Plus,
  Mail,
  Users,
  Eye,
  MousePointerClick,
  FileText,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { adminNavItems } from "../nav";

interface Campaign {
  id: string;
  subject: string;
  previewText: string | null;
  recipientType: string;
  recipientLists: string[] | null;
  recipientCount: number;
  status: "draft" | "sending" | "sent" | "failed";
  sentAt: string | null;
  createdAt: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  uniqueOpens: number;
  uniqueClicks: number;
  createdByEmail: string;
}

interface Stats {
  totalCampaigns: number;
  draftCount: number;
  sentCount: number;
  totalRecipients: number;
}

export default function AdminEmailsPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "sent" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const fetchCampaigns = useCallback(async () => {
    setIsLoadingCampaigns(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filter !== "all") {
        params.set("status", filter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/emails?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      fetchCampaigns();
    }
  }, [loading, isAuthenticated, user?.role, fetchCampaigns]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getRecipientLabel = (campaign: Campaign) => {
    if (campaign.recipientType === "individual") {
      return "Individual";
    }
    if (campaign.recipientLists && campaign.recipientLists.length > 0) {
      return campaign.recipientLists.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ");
    }
    return campaign.recipientType.charAt(0).toUpperCase() + campaign.recipientType.slice(1);
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.totalSent === 0) return 0;
    return Math.round((campaign.uniqueOpens / campaign.totalSent) * 100);
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.totalSent === 0) return 0;
    return Math.round((campaign.uniqueClicks / campaign.totalSent) * 100);
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              title="Email Campaigns"
              description="Create and manage email marketing campaigns"
            />
            <div className="flex gap-2">
              <Link href="/admin/emails/templates">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/admin/emails/compose">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total Campaigns</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.totalCampaigns ?? 0}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Drafts</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.draftCount ?? 0}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Send className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Sent</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.sentCount ?? 0}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Total Recipients</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats?.totalRecipients ?? 0}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns by subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("draft")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Drafts
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("sent")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Sent
            </Button>
            <Button
              variant={filter === "failed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("failed")}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Failed
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCampaigns}
              disabled={isLoadingCampaigns}
              className="ml-auto"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingCampaigns && "animate-spin")} />
            </Button>
          </div>

          {/* Campaigns Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {!isLoadingCampaigns && campaigns.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {debouncedSearch
                    ? `No campaigns found matching "${debouncedSearch}"`
                    : filter === "all"
                    ? "No campaigns yet. Create your first campaign!"
                    : `No ${filter} campaigns found`}
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <Link key={campaign.id} href={campaign.status === "draft" ? `/admin/emails/compose?id=${campaign.id}` : `/admin/emails/${campaign.id}`}>
                    <div className="p-4 hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold line-clamp-2">{campaign.subject}</h3>
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                            campaign.status === "draft" && "bg-yellow-100 text-yellow-800",
                            campaign.status === "sending" && "bg-blue-100 text-blue-800",
                            campaign.status === "sent" && "bg-green-100 text-green-800",
                            campaign.status === "failed" && "bg-red-100 text-red-800"
                          )}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span>{getRecipientLabel(campaign)}</span>
                        <span>•</span>
                        <span>{campaign.recipientCount} recipients</span>
                      </div>
                      {campaign.status === "sent" && (
                        <div className="flex gap-4 text-sm mb-2">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span>{getOpenRate(campaign)}% opened</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                            <span>{getClickRate(campaign)}% clicked</span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {campaign.sentAt ? `Sent ${formatDate(campaign.sentAt)}` : `Created ${formatDate(campaign.createdAt)}`}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <table className="w-full hidden md:table table-fixed">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Subject</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Recipients</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Opens</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Clicks</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoadingCampaigns && campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {debouncedSearch
                        ? `No campaigns found matching "${debouncedSearch}"`
                        : filter === "all"
                        ? "No campaigns yet. Create your first campaign!"
                        : `No ${filter} campaigns found`}
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={campaign.status === "draft" ? `/admin/emails/compose?id=${campaign.id}` : `/admin/emails/${campaign.id}`} className="block">
                          <div className="font-medium hover:underline">{campaign.subject}</div>
                          {campaign.previewText && (
                            <div className="text-sm text-muted-foreground truncate">{campaign.previewText}</div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{getRecipientLabel(campaign)}</div>
                        <div className="text-xs text-muted-foreground">{campaign.recipientCount} recipients</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            campaign.status === "draft" && "bg-yellow-100 text-yellow-800",
                            campaign.status === "sending" && "bg-blue-100 text-blue-800",
                            campaign.status === "sent" && "bg-green-100 text-green-800",
                            campaign.status === "failed" && "bg-red-100 text-red-800"
                          )}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {campaign.status === "sent" ? (
                          <div className="text-sm">
                            <span className="font-medium">{getOpenRate(campaign)}%</span>
                            <span className="text-muted-foreground ml-1">({campaign.uniqueOpens})</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {campaign.status === "sent" ? (
                          <div className="text-sm">
                            <span className="font-medium">{getClickRate(campaign)}%</span>
                            <span className="text-muted-foreground ml-1">({campaign.uniqueClicks})</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {campaign.sentAt ? formatDate(campaign.sentAt) : formatDate(campaign.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={setPage}
            disabled={isLoadingCampaigns}
          />
        </>
      )}
    </DashboardLayout>
  );
}
