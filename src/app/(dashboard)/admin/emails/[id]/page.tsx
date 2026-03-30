"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import {
  Send,
  Users,
  Eye,
  MousePointerClick,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Mail,
  Clock,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { adminNavItems } from "../../nav";
import { toast } from "sonner";

interface Campaign {
  id: string;
  subject: string;
  previewText: string | null;
  content: string;
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

interface Recipient {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const { user, isLoading: loading, isAuthenticated } = useUser();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSyncingStats, setIsSyncingStats] = useState(false);

  // Pagination for recipients
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "sent" | "opened" | "clicked" | "bounced">("all");

  // Preview
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const fetchCampaign = useCallback(async () => {
    setIsLoadingCampaign(true);
    try {
      const res = await fetch(`/api/admin/emails/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      } else {
        toast.error("Campaign not found");
        router.push("/admin/emails");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setIsLoadingCampaign(false);
    }
  }, [campaignId, router]);

  const fetchRecipients = useCallback(async () => {
    setIsLoadingRecipients(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (recipientFilter !== "all") {
        params.set("filter", recipientFilter);
      }

      const res = await fetch(`/api/admin/emails/${campaignId}/recipients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching recipients:", error);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [campaignId, page, recipientFilter]);

  const loadPreview = useCallback(async () => {
    if (!campaign?.content) return;

    setIsLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: campaign.content, previewText: campaign.previewText }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html);
      }
    } catch (error) {
      console.error("Error loading preview:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [campaign?.content, campaign?.previewText]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      fetchCampaign();
    }
  }, [loading, isAuthenticated, user?.role, fetchCampaign]);

  useEffect(() => {
    if (campaign && campaign.status === "sent") {
      fetchRecipients();
    }
  }, [campaign, fetchRecipients]);

  useEffect(() => {
    if (campaign?.content) {
      loadPreview();
    }
  }, [campaign?.content, loadPreview]);

  const handleSyncStats = async () => {
    setIsSyncingStats(true);
    try {
      const res = await fetch(`/api/admin/emails/${campaignId}/sync-stats`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Stats synced successfully");
        fetchCampaign();
        fetchRecipients();
      } else {
        toast.error("Failed to sync stats");
      }
    } catch (error) {
      console.error("Error syncing stats:", error);
      toast.error("Failed to sync stats");
    } finally {
      setIsSyncingStats(false);
    }
  };

  const handleRecipientFilterChange = (filter: typeof recipientFilter) => {
    setRecipientFilter(filter);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getOpenRate = () => {
    if (!campaign || campaign.totalSent === 0) return 0;
    return Math.round((campaign.uniqueOpens / campaign.totalSent) * 100);
  };

  const getClickRate = () => {
    if (!campaign || campaign.totalSent === 0) return 0;
    return Math.round((campaign.uniqueClicks / campaign.totalSent) * 100);
  };

  const getBounceRate = () => {
    if (!campaign || campaign.totalSent === 0) return 0;
    return Math.round((campaign.totalBounced / campaign.totalSent) * 100);
  };

  const getRecipientLabel = () => {
    if (!campaign) return "";
    if (campaign.recipientType === "individual") {
      return "Individual";
    }
    if (campaign.recipientLists && campaign.recipientLists.length > 0) {
      return campaign.recipientLists.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(", ");
    }
    return campaign.recipientType.charAt(0).toUpperCase() + campaign.recipientType.slice(1);
  };

  if (loading || isLoadingCampaign) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Campaign not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="mb-6">
        <Link
          href="/admin/emails"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <PageHeader title={campaign.subject} description={`Sent to ${getRecipientLabel()}`} />
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn(
                  campaign.status === "sent" && "bg-green-100 text-green-800",
                  campaign.status === "sending" && "bg-blue-100 text-blue-800",
                  campaign.status === "failed" && "bg-red-100 text-red-800",
                  campaign.status === "draft" && "bg-yellow-100 text-yellow-800"
                )}
              >
                {campaign.status}
              </Badge>
              {campaign.sentAt && (
                <span className="text-sm text-muted-foreground">
                  Sent {formatDate(campaign.sentAt)}
                </span>
              )}
            </div>
          </div>
          {campaign.status === "sent" && (
            <Button variant="outline" onClick={handleSyncStats} disabled={isSyncingStats}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isSyncingStats && "animate-spin")} />
              Sync Stats
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {campaign.status === "sent" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Send className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Sent</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold">{campaign.totalSent}</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Opened</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold">{campaign.uniqueOpens}</div>
            <div className="text-xs text-muted-foreground">{getOpenRate()}% rate</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Clicked</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold">{campaign.uniqueClicks}</div>
            <div className="text-xs text-muted-foreground">{getClickRate()}% rate</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Bounced</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold">{campaign.totalBounced}</div>
            <div className="text-xs text-muted-foreground">{getBounceRate()}% rate</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Recipients</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold">{campaign.recipientCount}</div>
          </div>
        </div>
      )}

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Email Preview</TabsTrigger>
          {campaign.status === "sent" && <TabsTrigger value="recipients">Recipients</TabsTrigger>}
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                {campaign.previewText || "No preview text set"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg">
                  <div className="animate-pulse text-muted-foreground">Loading preview...</div>
                </div>
              ) : previewHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[600px]"
                    title="Email Preview"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg text-muted-foreground">
                  No content to preview
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>
                {total} recipients in this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={recipientFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRecipientFilterChange("all")}
                >
                  All
                </Button>
                <Button
                  variant={recipientFilter === "sent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRecipientFilterChange("sent")}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Sent
                </Button>
                <Button
                  variant={recipientFilter === "opened" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRecipientFilterChange("opened")}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Opened
                </Button>
                <Button
                  variant={recipientFilter === "clicked" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRecipientFilterChange("clicked")}
                >
                  <MousePointerClick className="w-4 h-4 mr-1" />
                  Clicked
                </Button>
                <Button
                  variant={recipientFilter === "bounced" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRecipientFilterChange("bounced")}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Bounced
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRecipients}
                  disabled={isLoadingRecipients}
                  className="ml-auto"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoadingRecipients && "animate-spin")} />
                </Button>
              </div>

              {/* Recipients Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[25%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Email
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Name
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Opened
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Clicked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {!isLoadingRecipients && recipients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No recipients found
                        </td>
                      </tr>
                    ) : (
                      recipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm truncate">{recipient.email}</td>
                          <td className="px-4 py-3 text-sm truncate text-muted-foreground">
                            {recipient.name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {recipient.bouncedAt ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <XCircle className="w-3 h-3" />
                                Bounced
                              </span>
                            ) : recipient.status === "sent" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Sent
                              </span>
                            ) : recipient.status === "failed" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {recipient.openedAt ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {recipient.clickedAt ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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
                disabled={isLoadingRecipients}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
