"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, UserPlus, Copy, Check, Mail, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface InviteMerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMerchantDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteMerchantDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "direct">("link");

  // Generate Link tab state
  const [linkEmail, setLinkEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Create Directly tab state
  const [directEmail, setDirectEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLinkEmail("");
      setExpiresInDays("7");
      setSendInviteEmail(true);
      setGeneratedLink("");
      setLinkCopied(false);
      setLinkError("");

      setDirectEmail("");
      setBusinessName("");
      setCity("");
      setCategoryId("");
      setPhone("");
      setWebsite("");
      setDescription("");
      setSendWelcomeEmail(true);
      setCreateError("");
      setCreateSuccess(false);
    }
  }, [open]);

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setGeneratedLink("");
    setLinkError("");

    try {
      const res = await fetch("/api/admin/merchant-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: linkEmail || null,
          expiresInDays: parseInt(expiresInDays),
          sendEmail: sendInviteEmail && !!linkEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data.inviteUrl);
        onSuccess?.();
      } else {
        const data = await res.json();
        setLinkError(data.error || "Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite:", error);
      setLinkError("Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCreateDirectly = async () => {
    setIsCreating(true);
    setCreateError("");
    setCreateSuccess(false);

    try {
      const res = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: directEmail,
          businessName,
          city: city || undefined,
          categoryId: categoryId || undefined,
          phone: phone || undefined,
          website: website || undefined,
          description: description || undefined,
          sendWelcomeEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCreateSuccess(true);
        onSuccess?.();
        // Auto-close after success
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setCreateError(data.error || "Failed to create merchant");
      }
    } catch (error) {
      console.error("Error creating merchant:", error);
      setCreateError("Failed to create merchant");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Merchant</DialogTitle>
          <DialogDescription>
            Invite a new merchant to join Local City Places with 10 free trial GRCs ($100 each).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "direct")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <LinkIcon className="w-4 h-4 mr-2" />
              Generate Link
            </TabsTrigger>
            <TabsTrigger value="direct">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Directly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            {!generatedLink ? (
              <>
                <div>
                  <Label htmlFor="link-email">Email (optional)</Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="merchant@example.com"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pre-fills the email on the registration form
                  </p>
                </div>

                <div>
                  <Label htmlFor="expires">Link Expires In</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger id="expires">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {linkEmail && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="send-invite-email"
                      checked={sendInviteEmail}
                      onChange={(e) => setSendInviteEmail(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="send-invite-email" className="text-sm font-normal cursor-pointer">
                      Send invite email to merchant
                    </Label>
                  </div>
                )}

                {linkError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {linkError}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateLink} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Generate Link
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <Check className="w-5 h-5" />
                    Invite link generated!
                  </div>
                  <div className="bg-white border rounded-md p-3 font-mono text-sm break-all">
                    {generatedLink}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button onClick={handleCopyLink}>
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="direct" className="space-y-4 mt-4">
            {createSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <Check className="w-5 h-5" />
                  Merchant created successfully!
                </div>
                <p className="text-green-700 text-sm mt-1">
                  {sendWelcomeEmail
                    ? "A welcome email with login instructions has been sent."
                    : "The merchant can log in using their email."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="direct-email">Email *</Label>
                    <Input
                      id="direct-email"
                      type="email"
                      placeholder="merchant@example.com"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="business-name">Business Name *</Label>
                    <Input
                      id="business-name"
                      placeholder="Acme Coffee Shop"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Denver"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about this business..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="send-welcome-email"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="send-welcome-email" className="text-sm font-normal cursor-pointer">
                    Send welcome email with login link
                  </Label>
                </div>

                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {createError}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDirectly}
                    disabled={isCreating || !directEmail || !businessName}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Merchant
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
