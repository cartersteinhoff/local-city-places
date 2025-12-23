"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Send,
  UserPlus,
  Store,
  Gift,
  CheckCircle2,
  LogIn,
  Sparkles,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "auth" | "member" | "merchant" | "grc";
  previewParams: Record<string, string | number>;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "magic-link",
    name: "Magic Link (Sign In)",
    description: "Sent when existing users request to sign in via email link",
    icon: <LogIn className="w-5 h-5" />,
    category: "auth",
    previewParams: {
      email: "user@example.com",
      token: "sample-token-12345",
    },
  },
  {
    id: "welcome",
    name: "Welcome (New Member)",
    description: "Sent when admin creates a new member account",
    icon: <UserPlus className="w-5 h-5" />,
    category: "member",
    previewParams: {
      email: "newmember@example.com",
      token: "sample-token-12345",
    },
  },
  {
    id: "grc-issued",
    name: "GRC Issued",
    description: "Sent when a merchant issues a GRC to a customer",
    icon: <Gift className="w-5 h-5" />,
    category: "grc",
    previewParams: {
      recipientEmail: "customer@example.com",
      recipientName: "John Smith",
      merchantName: "Example Business",
      denomination: 120,
      totalMonths: 12,
      claimUrl: "https://localcityplaces.com/claim/abc123",
    },
  },
  {
    id: "merchant-invite",
    name: "Merchant Invite",
    description: "Sent to invite a new merchant to join the platform",
    icon: <Store className="w-5 h-5" />,
    category: "merchant",
    previewParams: {
      email: "merchant@example.com",
      inviteUrl: "https://localcityplaces.com/onboard/abc123",
      expiresInDays: 7,
    },
  },
  {
    id: "merchant-welcome",
    name: "Merchant Welcome (with Trial)",
    description: "Sent when a merchant completes registration with trial GRCs",
    icon: <Sparkles className="w-5 h-5" />,
    category: "merchant",
    previewParams: {
      email: "merchant@example.com",
      businessName: "Example Business",
      loginUrl: "https://localcityplaces.com/login",
      trialGrcCount: 10,
      trialGrcDenomination: 120,
    },
  },
  {
    id: "merchant-welcome-no-trial",
    name: "Merchant Welcome (No Trial)",
    description: "Sent when merchant registers via invite link (trial GRCs pending)",
    icon: <Store className="w-5 h-5" />,
    category: "merchant",
    previewParams: {
      email: "merchant@example.com",
      businessName: "Example Business",
      loginUrl: "https://localcityplaces.com/login",
    },
  },
  {
    id: "trial-grcs-activated",
    name: "Trial GRCs Activated",
    description: "Sent when admin activates trial GRCs for a merchant",
    icon: <CheckCircle2 className="w-5 h-5" />,
    category: "merchant",
    previewParams: {
      email: "merchant@example.com",
      businessName: "Example Business",
      loginUrl: "https://localcityplaces.com/login",
      trialGrcCount: 10,
      trialGrcDenomination: 120,
    },
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  auth: { label: "Authentication", color: "bg-blue-100 text-blue-700" },
  member: { label: "Member", color: "bg-green-100 text-green-700" },
  merchant: { label: "Merchant", color: "bg-purple-100 text-purple-700" },
  grc: { label: "GRC", color: "bg-orange-100 text-orange-700" },
};

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const loadPreview = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsLoadingPreview(true);

    try {
      const res = await fetch("/api/admin/emails/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          params: template.previewParams,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to load preview");
      }

      const { html } = await res.json();
      setPreviewHtml(html);
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to load email preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return;

    setIsSendingTest(true);
    try {
      const res = await fetch("/api/admin/emails/templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          to: testEmail,
          params: selectedTemplate.previewParams,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send test email");
      }

      toast.success(`Test email sent to ${testEmail}`);
      setTestDialogOpen(false);
      setTestEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredTemplates = activeCategory === "all"
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Emails
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Email Templates</h1>
            <p className="text-sm text-muted-foreground">
              Preview and test transactional emails
            </p>
          </div>
        </div>
        {selectedTemplate && (
          <Button size="sm" onClick={() => setTestDialogOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar - Template List */}
        <div className="w-[280px] shrink-0 flex flex-col border rounded-lg bg-card">
          {/* Category Filter */}
          <div className="p-3 border-b">
            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeCategory === "all" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveCategory("all")}
              >
                All
              </Button>
              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-auto">
            {filteredTemplates.map((template) => {
              const category = CATEGORY_LABELS[template.category];
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <button
                  key={template.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-b-0",
                    isSelected
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => loadPreview(template)}
                >
                  <div className={cn(
                    "p-1.5 rounded shrink-0",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{template.name}</div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", category.color)}>
                      {category.label}
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
                    isSelected && "text-primary"
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card min-w-0">
          {!selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Mail className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a template to preview</p>
            </div>
          ) : isLoadingPreview ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading preview...</p>
            </div>
          ) : (
            <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Source</TabsTrigger>
                </TabsList>
                {/* Inline Parameters */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    {Object.entries(selectedTemplate.previewParams).slice(0, 2).map(([key, value], i) => (
                      <span key={key}>
                        {i > 0 && " · "}
                        <span className="font-mono">{key}:</span> {String(value).slice(0, 20)}{String(value).length > 20 && "..."}
                      </span>
                    ))}
                    {Object.keys(selectedTemplate.previewParams).length > 2 && (
                      <span> · +{Object.keys(selectedTemplate.previewParams).length - 2} more</span>
                    )}
                  </span>
                </div>
              </div>
              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </TabsContent>
              <TabsContent value="html" className="flex-1 m-0 overflow-auto p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
                  {previewHtml}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Send Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test "{selectedTemplate?.name}" email to verify it looks correct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="testEmail">Recipient Email</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendTestEmail} disabled={!testEmail || isSendingTest}>
              {isSendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
