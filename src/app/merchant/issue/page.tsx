"use client";

import { useEffect, useState } from "react";
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
import { Upload, CheckCircle, Copy, ExternalLink, Info } from "lucide-react";
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
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [denomination, setDenomination] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedGrc, setIssuedGrc] = useState<IssuedGrc | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetch("/api/merchant/grcs/inventory")
        .then((res) => res.json())
        .then((data) => {
          if (data.availableDenominations) {
            setInventory(data.availableDenominations);
          }
          setInventoryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load inventory:", err);
          setInventoryLoading(false);
        });
    }
  }, [loading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

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
      const invRes = await fetch("/api/merchant/grcs/inventory");
      const invData = await invRes.json();
      if (invData.availableDenominations) {
        setInventory(invData.availableDenominations);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (issuedGrc) {
      await navigator.clipboard.writeText(issuedGrc.claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleIssueAnother = () => {
    setIssuedGrc(null);
    setEmail("");
    setRecipientName("");
    setDenomination("");
  };

  const totalAvailable = inventory.reduce((sum, i) => sum + i.available, 0);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Issue GRC"
            description="Send a grocery rebate certificate to a customer"
            action={
              <a
                href="/merchant/issue/bulk"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </a>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Issue Form */}
            <div className="lg:col-span-2">
              {issuedGrc ? (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">GRC Issued Successfully!</h2>
                    <p className="text-muted-foreground mb-6">
                      A ${issuedGrc.denomination} GRC has been created for{" "}
                      <span className="font-medium text-foreground">{issuedGrc.recipientEmail}</span>
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-muted-foreground mb-2">Claim Link</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background rounded px-3 py-2 overflow-hidden text-ellipsis">
                          {issuedGrc.claimUrl}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="flex-shrink-0"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <a
                          href={issuedGrc.claimUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button onClick={handleIssueAnother}>Issue Another GRC</Button>
                      <a href="/merchant/grcs">
                        <Button variant="outline">View All GRCs</Button>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Recipient Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="customer@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Recipient Name (optional)</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="denomination">GRC Value *</Label>
                      {inventoryLoading ? (
                        <div className="h-10 bg-muted animate-pulse rounded-md" />
                      ) : inventory.length === 0 ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            No GRC inventory available. Purchase GRCs to start issuing.
                          </p>
                          <a
                            href="/merchant/purchase"
                            className="text-sm text-primary font-medium hover:underline mt-2 inline-block"
                          >
                            Purchase GRCs →
                          </a>
                        </div>
                      ) : (
                        <Select value={denomination} onValueChange={setDenomination} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select denomination" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((item) => (
                              <SelectItem key={item.denomination} value={item.denomination.toString()}>
                                ${item.denomination} ({item.available} available)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        The recipient will receive an email with a link to claim their GRC and start
                        earning grocery rebates.
                      </p>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || inventory.length === 0 || !denomination}
                    >
                      {submitting ? "Issuing..." : "Issue GRC"}
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Inventory Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Your GRC Inventory</h3>
                {inventoryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No inventory</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {inventory.map((item) => (
                        <div
                          key={item.denomination}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="font-medium">${item.denomination}</span>
                          <span className="text-muted-foreground">{item.available} available</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span>{totalAvailable} GRCs</span>
                      </div>
                    </div>
                  </>
                )}
                <a
                  href="/merchant/purchase"
                  className="block mt-4 text-center px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                >
                  Purchase More GRCs
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
