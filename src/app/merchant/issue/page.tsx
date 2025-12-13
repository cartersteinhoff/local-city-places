"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, ShoppingCart, Send, Copy, Check, ExternalLink } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";

interface InventoryItem {
  denomination: number;
  available: number;
  costPerCert: number;
}

interface IssuedGrc {
  id: string;
  denomination: number;
  claimUrl: string;
  recipientEmail: string;
  recipientName: string | null;
}

export default function IssueGrcPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  // Form state
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [denomination, setDenomination] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Success state
  const [issuedGrc, setIssuedGrc] = useState<IssuedGrc | null>(null);
  const [copied, setCopied] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  // Load inventory after auth completes
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const loadInventory = async () => {
        try {
          const res = await fetch("/api/merchant/grcs/inventory");
          const data = await res.json();
          if (data.availableDenominations) {
            setInventory(data.availableDenominations);
            if (data.availableDenominations.length > 0) {
              setDenomination(data.availableDenominations[0].denomination.toString());
            }
          }
        } catch (err) {
          console.error("Failed to load inventory:", err);
        } finally {
          setIsLoadingInventory(false);
        }
      };
      loadInventory();
    }
  }, [loading, isAuthenticated]);

  const fetchInventory = useCallback(async () => {
    setIsLoadingInventory(true);
    try {
      const res = await fetch("/api/merchant/grcs/inventory");
      const data = await res.json();
      if (data.availableDenominations) {
        setInventory(data.availableDenominations);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setIsLoadingInventory(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/merchant/grcs/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          recipientName: recipientName || undefined,
          denomination: parseInt(denomination),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to issue GRC");
        return;
      }

      setIssuedGrc(data.grc);
      // Refresh inventory
      fetchInventory();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (issuedGrc?.claimUrl) {
      await navigator.clipboard.writeText(issuedGrc.claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleIssueAnother = () => {
    setIssuedGrc(null);
    setEmail("");
    setRecipientName("");
    setCopied(false);
  };

  const hasInventory = inventory.length > 0;

  // Success view after issuing
  if (issuedGrc) {
    return (
      <DashboardLayout navItems={merchantNavItems}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">GRC Issued Successfully!</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            A ${issuedGrc.denomination} GRC has been created for {issuedGrc.recipientEmail}.
            Share the claim link below so they can register their certificate.
          </p>

          <div className="w-full max-w-md mb-6">
            <Label className="text-left block mb-2">Claim Link</Label>
            <div className="flex gap-2">
              <Input
                value={issuedGrc.claimUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={issuedGrc.claimUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-left">
              Send this link to {issuedGrc.recipientEmail} so they can claim their GRC
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleIssueAnother}>
              <Send className="w-4 h-4 mr-2" />
              Issue Another
            </Button>
            <Button variant="outline" asChild>
              <a href="/merchant/grcs">View All GRCs</a>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Wait for auth before showing anything
  if (loading) {
    return <DashboardLayout navItems={merchantNavItems}>{null}</DashboardLayout>;
  }

  // No inventory after loading - show purchase prompt
  if (!isLoadingInventory && !hasInventory) {
    return (
      <DashboardLayout navItems={merchantNavItems}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Purchase GRCs to Get Started</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            You don&apos;t have any GRCs available to issue. Purchase GRCs first, then once your payment is confirmed you can issue them to customers.
          </p>
          <a
            href="/merchant/purchase"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Purchase GRCs
          </a>
        </div>
      </DashboardLayout>
    );
  }

  // Show form (inventory loads in background, static content shows immediately)
  return (
    <DashboardLayout navItems={merchantNavItems}>
      <PageHeader
        title="Issue GRC"
        description="Send a grocery rebate certificate to a customer"
      />

      {/* Inventory Summary - fixed height to prevent CLS */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-2">Available Inventory</h3>
        <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
          {isLoadingInventory ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : inventory.length > 0 ? (
            inventory.map((item) => (
              <span
                key={item.denomination}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border rounded-full text-sm"
              >
                <span className="font-medium">${item.denomination}</span>
                <span className="text-muted-foreground">×{item.available}</span>
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No inventory available</span>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issue Form */}
        <div className="bg-card border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Recipient Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                They&apos;ll receive a link to claim their GRC
              </p>
            </div>

            <div>
              <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="John Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="denomination">GRC Value *</Label>
              <Select value={denomination} onValueChange={setDenomination} disabled={isLoadingInventory}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingInventory ? "Loading..." : "Select amount"} />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.denomination} value={item.denomination.toString()}>
                      ${item.denomination} ({item.available} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !email || !denomination || isLoadingInventory}>
              {isSubmitting ? (
                "Issuing..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Issue GRC
                </>
              )}
            </Button>
          </form>

          {/* Quick Links */}
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
            <a href="/merchant/issue/bulk" className="text-primary hover:underline">
              Issue multiple GRCs →
            </a>
            <a href="/merchant/purchase" className="text-primary hover:underline">
              Purchase more →
            </a>
          </div>
        </div>

        {/* How It Works - Static, shows immediately */}
        <div className="bg-muted/30 border rounded-xl p-6">
          <h3 className="font-semibold mb-4">How It Works</h3>
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
              <div>
                <p className="font-medium">You issue a GRC</p>
                <p className="text-muted-foreground">A unique claim link is generated for your customer.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
              <div>
                <p className="font-medium">Customer claims the GRC</p>
                <p className="text-muted-foreground">They create an account and select their preferred grocery store.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
              <div>
                <p className="font-medium">Monthly receipt uploads</p>
                <p className="text-muted-foreground">Customer uploads grocery receipts each month to qualify for rebates.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">4</span>
              <div>
                <p className="font-medium">Customer gets paid</p>
                <p className="text-muted-foreground">After completing all months, they receive the full rebate amount.</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The GRC value is the rebate your customer earns, not your cost. Your cost per certificate varies by denomination.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
