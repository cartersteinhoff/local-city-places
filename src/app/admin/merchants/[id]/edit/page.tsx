"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";

interface Category {
  id: string;
  name: string;
}

export default function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [cityState, setCityState] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [urls, setUrls] = useState<{ full: string | null; short: string | null }>({ full: null, short: null });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

  // Fetch merchant data
  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch(`/api/admin/merchant-pages/${id}`);
        if (res.ok) {
          const data = await res.json();
          const m = data.merchant;

          setBusinessName(m.businessName || "");
          setCityState([m.city, m.state].filter(Boolean).join(", "));
          setPhone(formatPhoneNumber(m.phone || ""));
          setWebsite(m.website || "");
          setCategoryId(m.categoryId || "");
          setDescription(m.description || "");
          setVimeoUrl(m.vimeoUrl || "");
          setUrls(m.urls);
        } else {
          setError("Merchant not found");
        }
      } catch (err) {
        console.error("Error fetching merchant:", err);
        setError("Failed to load merchant");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && isAuthenticated && id) {
      fetchMerchant();
    }
  }, [authLoading, isAuthenticated, id]);

  const parseCityState = (value: string): { city: string; state: string } => {
    const parts = value.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      const state = parts[parts.length - 1].toUpperCase().slice(0, 2);
      const city = parts.slice(0, -1).join(", ");
      return { city, state };
    }
    return { city: value.trim(), state: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const { city, state } = parseCityState(cityState);

      // Validation
      if (!businessName.trim()) {
        throw new Error("Business name is required");
      }
      if (!city) {
        throw new Error("City is required");
      }
      if (!state || state.length !== 2) {
        throw new Error("State must be a 2-letter code (e.g., CO, CA)");
      }
      const strippedPhone = stripPhoneNumber(phone);
      if (!strippedPhone || strippedPhone.length !== 10) {
        throw new Error("Phone number must be 10 digits");
      }
      if (vimeoUrl && !isValidVimeoUrl(vimeoUrl)) {
        throw new Error("Invalid Vimeo URL. Use format: https://vimeo.com/123456789");
      }

      const res = await fetch(`/api/admin/merchant-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          city,
          state,
          phone: strippedPhone,
          website: website.trim() || null,
          categoryId: categoryId || null,
          description: description.trim() || null,
          vimeoUrl: vimeoUrl.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update merchant page");
      }

      setUrls(data.urls);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${text}` : text;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error && !businessName ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/admin/merchants">Back to Merchant Pages</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/admin/merchants">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Merchant Pages
              </Link>
            </Button>
            <PageHeader
              title="Edit Merchant Page"
              description={businessName}
            />
          </div>

          {/* URLs */}
          {(urls.full || urls.short) && (
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {urls.short && (
                <div className="bg-card border rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Short URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      {getFullUrl(urls.short)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => copyToClipboard(urls.short!, "short")}
                    >
                      {copiedUrl === "short" ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {urls.full && (
                <div className="bg-card border rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Full URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      {urls.full}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      asChild
                    >
                      <a href={urls.full} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                required
              />
            </div>

            {/* City, State */}
            <div>
              <Label htmlFor="cityState">City, State *</Label>
              <Input
                id="cityState"
                value={cityState}
                onChange={(e) => setCityState(e.target.value)}
                placeholder="Denver, CO"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: City, ST (e.g., Denver, CO)
              </p>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="(425) 577-9060"
                required
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the business..."
                rows={4}
              />
            </div>

            {/* Vimeo URL */}
            <div>
              <Label htmlFor="vimeoUrl">Vimeo Video URL</Label>
              <Input
                id="vimeoUrl"
                type="url"
                value={vimeoUrl}
                onChange={(e) => setVimeoUrl(e.target.value)}
                placeholder="https://vimeo.com/1160781582"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Embed a featured video on the merchant page
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 text-green-800 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                Changes saved successfully
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/admin/merchants">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
