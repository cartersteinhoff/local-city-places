"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";

interface EmailPreferences {
  email: string;
  marketingEmails: boolean;
  transactionalEmails: boolean;
  unsubscribedAll: boolean;
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);

  // Form state
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [transactionalEmails, setTransactionalEmails] = useState(true);
  const [unsubscribedAll, setUnsubscribedAll] = useState(false);

  useEffect(() => {
    async function fetchPreferences() {
      if (!userId && !email) {
        setError("Invalid unsubscribe link. Missing user identifier.");
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        if (email) params.set("email", email);

        const res = await fetch(`/api/unsubscribe?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPreferences(data);
          setMarketingEmails(data.marketingEmails);
          setTransactionalEmails(data.transactionalEmails);
          setUnsubscribedAll(data.unsubscribedAll);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load preferences");
        }
      } catch (err) {
        setError("Failed to load email preferences");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [userId, email]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          marketingEmails,
          transactionalEmails,
          unsubscribedAll,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update preferences");
      }
    } catch (err) {
      setError("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          marketingEmails: false,
          transactionalEmails: false,
          unsubscribedAll: true,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setUnsubscribedAll(true);
        setMarketingEmails(false);
        setTransactionalEmails(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update preferences");
      }
    } catch (err) {
      setError("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !preferences) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preferences Updated</h2>
          <p className="text-muted-foreground">
            {unsubscribedAll
              ? "You have been unsubscribed from all emails."
              : "Your email preferences have been saved."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Manage your email subscription for{" "}
          <span className="font-medium text-foreground">{preferences?.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Newsletters, announcements, and promotions
              </p>
            </div>
            <Switch
              id="marketing"
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
              disabled={unsubscribedAll}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="transactional">Account Notifications</Label>
              <p className="text-sm text-muted-foreground">
                GRC updates, receipts, and important account info
              </p>
            </div>
            <Switch
              id="transactional"
              checked={transactionalEmails}
              onCheckedChange={setTransactionalEmails}
              disabled={unsubscribedAll}
            />
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || unsubscribedAll}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleUnsubscribeAll}
            disabled={isSaving || unsubscribedAll}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Unsubscribe from All Emails
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Even if you unsubscribe, you may still receive essential account
          security emails (password resets, etc.)
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
