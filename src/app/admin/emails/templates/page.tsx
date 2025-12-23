"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Eye,
  UserPlus,
  Store,
  Gift,
  CheckCircle2,
  LogIn,
  Sparkles,
  Loader2,
} from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/emails">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Emails
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">
          Preview and test all transactional email templates
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
        >
          All Templates
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
          <Button
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Templates</h2>
          <div className="space-y-3">
            {filteredTemplates.map((template) => {
              const category = CATEGORY_LABELS[template.category];
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => loadPreview(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{template.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}
                          >
                            {category.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadPreview(template);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview</h2>
            {selectedTemplate && (
              <Button
                size="sm"
                onClick={() => setTestDialogOpen(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            )}
          </div>

          <Card className="min-h-[600px]">
            {!selectedTemplate ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                <Mail className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a template to preview</p>
              </div>
            ) : isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            ) : (
              <div className="h-[600px] overflow-hidden">
                <Tabs defaultValue="preview" className="h-full flex flex-col">
                  <div className="px-4 pt-4 border-b">
                    <TabsList>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="html">HTML Source</TabsTrigger>
                    </TabsList>
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
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg overflow-auto max-h-[520px]">
                      {previewHtml}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>

          {/* Template Parameters */}
          {selectedTemplate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Template Parameters</CardTitle>
                <CardDescription>
                  Sample values used for this preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(selectedTemplate.previewParams).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-muted-foreground">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
