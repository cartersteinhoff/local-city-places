"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Send,
  Save,
  Users,
  UserCheck,
  Store,
  Shield,
  Info,
  Mail,
  Search,
  CheckCircle,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { TipTapEditor, type TipTapEditorRef } from "@/components/tiptap-editor";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { adminNavItems } from "../../nav";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const emailLists = [
  {
    key: "members",
    name: "Members",
    description: "All registered members",
    icon: Users,
  },
  {
    key: "merchants",
    name: "Merchants",
    description: "Business owners",
    icon: Store,
  },
  {
    key: "admins",
    name: "Admins",
    description: "System administrators",
    icon: Shield,
  },
];

function ComposeEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<TipTapEditorRef>(null);
  const { user, isLoading: loading, isAuthenticated } = useUser();

  // Form state
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [isIndividualMode, setIsIndividualMode] = useState(false);
  const [individualRecipient, setIndividualRecipient] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Campaign state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Action state
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Preview state
  const [activeTab, setActiveTab] = useState("editor");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Load existing draft if ID provided
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDraftId(id);
      loadCampaign(id);
    }
  }, [searchParams]);

  const loadCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/emails/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubject(data.campaign.subject);
        setPreviewText(data.campaign.previewText || "");
        setContentHtml(data.campaign.content);
        if (data.campaign.recipientType === "individual") {
          setIsIndividualMode(true);
        } else if (data.campaign.recipientLists) {
          setSelectedLists(data.campaign.recipientLists);
        }
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Failed to load campaign");
    }
  };

  // Count recipients when lists change
  const fetchRecipientCount = useCallback(async () => {
    if (isIndividualMode) {
      setRecipientCount(individualRecipient ? 1 : 0);
      return;
    }

    if (selectedLists.length === 0) {
      setRecipientCount(0);
      return;
    }

    setIsLoadingCount(true);
    try {
      const params = new URLSearchParams();
      selectedLists.forEach((list) => params.append("lists", list));
      const res = await fetch(`/api/admin/emails/recipient-count?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecipientCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching recipient count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  }, [selectedLists, isIndividualMode, individualRecipient]);

  useEffect(() => {
    const timer = setTimeout(fetchRecipientCount, 300);
    return () => clearTimeout(timer);
  }, [fetchRecipientCount]);

  // Search users for individual selection
  useEffect(() => {
    if (!isIndividualMode || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isIndividualMode]);

  // Load preview when switching to preview tab
  useEffect(() => {
    if (activeTab === "preview" && contentHtml) {
      loadPreview();
    }
  }, [activeTab, contentHtml]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentHtml, subject, previewText }),
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
  };

  const handleListToggle = (listKey: string) => {
    setSelectedLists((prev) =>
      prev.includes(listKey) ? prev.filter((k) => k !== listKey) : [...prev, listKey]
    );
  };

  const selectUser = (user: SearchResult) => {
    setIndividualRecipient(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  const processImagesAndGetContent = async (): Promise<string> => {
    let processedContent = contentHtml;

    if (editorRef.current?.hasQueuedImages()) {
      toast.info("Uploading images...");
      const urlMapping = await editorRef.current.processImageQueue();

      for (const [base64Url, realUrl] of urlMapping.entries()) {
        const escapedBase64 = base64Url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        processedContent = processedContent.replace(new RegExp(escapedBase64, "g"), realUrl);
      }
    }

    return processedContent;
  };

  const handleSaveDraft = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!contentHtml.trim()) {
      toast.error("Email content is required");
      return;
    }

    if (!isIndividualMode && selectedLists.length === 0) {
      toast.error("Please select at least one recipient list");
      return;
    }

    setIsSaving(true);

    try {
      const processedContent = await processImagesAndGetContent();

      const body = {
        subject,
        previewText,
        content: processedContent,
        recipientType: isIndividualMode ? "individual" : "custom",
        recipientLists: isIndividualMode ? null : selectedLists,
        recipientCount,
        individualRecipientId: isIndividualMode ? individualRecipient?.id : null,
      };

      const url = draftId ? `/api/admin/emails/${draftId}` : "/api/admin/emails";
      const method = draftId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (!draftId) {
          setDraftId(data.campaign.id);
        }
        toast.success("Draft saved successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendCampaign = async () => {
    setShowSendDialog(false);
    setIsSending(true);

    try {
      const processedContent = await processImagesAndGetContent();

      // Save first if no draft ID
      if (!draftId) {
        const body = {
          subject,
          previewText,
          content: processedContent,
          recipientType: isIndividualMode ? "individual" : "custom",
          recipientLists: isIndividualMode ? null : selectedLists,
          recipientCount,
          individualRecipientId: isIndividualMode ? individualRecipient?.id : null,
        };

        const createRes = await fetch("/api/admin/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!createRes.ok) {
          throw new Error("Failed to create campaign");
        }

        const createData = await createRes.json();
        setDraftId(createData.campaign.id);

        // Now send
        const sendRes = await fetch(`/api/admin/emails/${createData.campaign.id}/send`, {
          method: "POST",
        });

        if (sendRes.ok) {
          const sendData = await sendRes.json();
          toast.success(
            `Campaign sent! ${sendData.sent} emails sent${sendData.failed ? `, ${sendData.failed} failed` : ""}`
          );
          router.push("/admin/emails");
        } else {
          const sendData = await sendRes.json();
          throw new Error(sendData.error || "Failed to send campaign");
        }
      } else {
        // Send existing draft
        const sendRes = await fetch(`/api/admin/emails/${draftId}/send`, {
          method: "POST",
        });

        if (sendRes.ok) {
          const sendData = await sendRes.json();
          toast.success(
            `Campaign sent! ${sendData.sent} emails sent${sendData.failed ? `, ${sendData.failed} failed` : ""}`
          );
          router.push("/admin/emails");
        } else {
          const sendData = await sendRes.json();
          throw new Error(sendData.error || "Failed to send campaign");
        }
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Test email address is required");
      return;
    }

    setIsSendingTest(true);

    try {
      const processedContent = await processImagesAndGetContent();

      const res = await fetch("/api/admin/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content: processedContent,
          previewText,
          testEmail,
        }),
      });

      if (res.ok) {
        toast.success(`Test email sent to ${testEmail}`);
        setShowTestDialog(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const isValid =
    subject.trim() &&
    contentHtml.trim() &&
    ((isIndividualMode && individualRecipient) || (!isIndividualMode && selectedLists.length > 0));

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="mb-6">
        <Link
          href="/admin/emails"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </Link>
        <PageHeader
          title={draftId ? "Edit Campaign" : "Compose Email Campaign"}
          description="Create and send broadcast emails to your users"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Configure your email campaign settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  disabled={isSaving || isSending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preview">Preview Text</Label>
                <Input
                  id="preview"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short preview text shown in inbox..."
                  disabled={isSaving || isSending}
                />
                <p className="text-xs text-muted-foreground">
                  This text appears after the subject line in most email clients
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Content Card */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Compose your email using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="editor" className="mt-4">
                  <TipTapEditor
                    ref={editorRef}
                    content={contentHtml}
                    onChange={(html) => setContentHtml(html)}
                    placeholder="Start writing your email content..."
                    className="min-h-[500px]"
                  />
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Available merge tags:</p>
                        <ul className="list-disc list-inside ml-4 space-y-0.5">
                          <li>
                            <code className="text-xs bg-background px-1 py-0.5 rounded">{`{{name}}`}</code> -
                            Full name
                          </li>
                          <li>
                            <code className="text-xs bg-background px-1 py-0.5 rounded">{`{{firstName}}`}</code>{" "}
                            - First name
                          </li>
                          <li>
                            <code className="text-xs bg-background px-1 py-0.5 rounded">{`{{email}}`}</code> -
                            Email address
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/30">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                    <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/30 text-muted-foreground">
                      No content to preview
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Recipients Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isIndividualMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsIndividualMode(false)}
                  className="flex-1"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Lists
                </Button>
                <Button
                  type="button"
                  variant={isIndividualMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsIndividualMode(true)}
                  className="flex-1"
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Individual
                </Button>
              </div>

              {!isIndividualMode ? (
                <>
                  {/* List Checkboxes */}
                  <div className="space-y-2">
                    {emailLists.map((list) => {
                      const Icon = list.icon;
                      return (
                        <div key={list.key} className="flex items-center space-x-3">
                          <Checkbox
                            id={list.key}
                            checked={selectedLists.includes(list.key)}
                            onCheckedChange={() => handleListToggle(list.key)}
                            disabled={isSaving || isSending}
                          />
                          <label
                            htmlFor={list.key}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{list.name}</span>
                              <p className="text-xs text-muted-foreground">{list.description}</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recipient Count */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center min-h-[24px]">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedLists.length > 0 ? (
                        isLoadingCount ? (
                          <span className="text-sm text-muted-foreground">Counting...</span>
                        ) : (
                          <span className="text-sm font-medium">
                            {recipientCount.toLocaleString()} recipient
                            {recipientCount !== 1 ? "s" : ""}
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">No recipients selected</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Individual User Search */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search email or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  {isSearching && (
                    <div className="text-sm text-muted-foreground">Searching...</div>
                  )}

                  {searchResults.length > 0 && (
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-1">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => selectUser(user)}
                          >
                            <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.name || user.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {individualRecipient && (
                    <div className="p-3 rounded-md bg-muted/50 border">
                      <p className="text-xs font-medium mb-1">Selected:</p>
                      <p className="text-sm truncate">
                        {individualRecipient.name || individualRecipient.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {individualRecipient.email}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => setIndividualRecipient(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Badge variant="secondary">{draftId ? "Draft" : "New"}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">From</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">team@localcityplaces.com</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Validation Checklist */}
              {!isValid && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 space-y-2">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
                    Complete these before sending:
                  </p>
                  <div className="space-y-1">
                    {!subject && (
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                        Add email subject
                      </div>
                    )}
                    {!contentHtml && (
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                        Add email content
                      </div>
                    )}
                    {!isIndividualMode && selectedLists.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                        Select recipient lists
                      </div>
                    )}
                    {isIndividualMode && !individualRecipient && (
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                        Select a recipient
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ready Indicator */}
              {isValid && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Ready to send!</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSaving || isSending}
                  variant="outline"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowTestDialog(true)}
                  disabled={isSaving || isSending || !subject || !contentHtml}
                  variant="secondary"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>

                <Button
                  onClick={() => setShowSendDialog(true)}
                  disabled={isSaving || isSending || !isValid}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Email Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              {isIndividualMode ? (
                <>This will immediately send the email to {individualRecipient?.email}.</>
              ) : (
                <>
                  This will immediately send the email to {recipientCount.toLocaleString()}{" "}
                  recipient{recipientCount !== 1 ? "s" : ""} across {selectedLists.length} selected
                  list{selectedLists.length !== 1 ? "s" : ""}.
                </>
              )}{" "}
              Make sure you have reviewed the content carefully. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendCampaign}>Send Campaign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Email Dialog */}
      <AlertDialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Test Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send a test version of this email to preview how it will look.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              The email will be sent with &quot;[TEST]&quot; prefix in the subject line.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingTest}>Cancel</AlertDialogCancel>
            <Button onClick={handleSendTestEmail} disabled={isSendingTest || !testEmail}>
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function LoadingFallback() {
  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );
}

export default function ComposeEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ComposeEmailContent />
    </Suspense>
  );
}
