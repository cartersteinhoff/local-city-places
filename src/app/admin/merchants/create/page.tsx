"use client";

import { useEffect, useState } from "react";
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
  GooglePlacesAutocomplete,
  PlaceDetails,
} from "@/components/ui/google-places-autocomplete";
import {
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../nav";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";

interface Category {
  id: string;
  name: string;
}

export default function CreateMerchantPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityState, setCityState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    urls: { full: string; short: string };
  } | null>(null);
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

  const handlePlaceSelect = (name: string, placeId: string, details?: PlaceDetails) => {
    if (details) {
      setBusinessName(details.name);
      setGooglePlaceId(details.placeId);

      // Set street address
      if (details.streetAddress) {
        setStreetAddress(details.streetAddress);
      }

      // Combine city and state
      if (details.city || details.state) {
        setCityState([details.city, details.state].filter(Boolean).join(", "));
      }

      // Set zip code
      if (details.zipCode) {
        setZipCode(details.zipCode);
      }

      if (details.phone) {
        setPhone(formatPhoneNumber(details.phone));
      }

      if (details.website) {
        setWebsite(details.website);
      }
    } else if (name) {
      setBusinessName(name);
      setGooglePlaceId(placeId);
    }
  };

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

      const res = await fetch("/api/admin/merchant-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          streetAddress: streetAddress.trim() || null,
          city,
          state,
          zipCode: zipCode.trim() || null,
          phone: strippedPhone,
          website: website.trim() || null,
          categoryId: categoryId || null,
          description: description.trim() || null,
          vimeoUrl: vimeoUrl.trim() || null,
          googlePlaceId: googlePlaceId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create merchant page");
      }

      setSuccess({ urls: data.urls });
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

  if (success) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Merchant Page Created!</h1>
            <p className="text-muted-foreground">
              The merchant page has been created successfully.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <Label className="text-sm text-muted-foreground">Short URL (for sharing)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
                  {getFullUrl(success.urls.short)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(success.urls.short, "short")}
                >
                  {copiedUrl === "short" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <Label className="text-sm text-muted-foreground">Full URL (SEO-friendly)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
                  {getFullUrl(success.urls.full)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(success.urls.full, "full")}
                >
                  {copiedUrl === "full" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/admin/merchants">
                Back to List
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <a href={success.urls.full} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Page
              </a>
            </Button>
          </div>

          <div className="text-center mt-6">
            <Button
              variant="link"
              onClick={() => {
                setSuccess(null);
                setBusinessName("");
                setStreetAddress("");
                setCityState("");
                setZipCode("");
                setPhone("");
                setWebsite("");
                setCategoryId("");
                setDescription("");
                setVimeoUrl("");
                setGooglePlaceId("");
              }}
            >
              Create Another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
              title="Create Merchant Page"
              description="Create a public page for a local business"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Places Search */}
            <div>
              <Label>Search Business</Label>
              <GooglePlacesAutocomplete
                value={businessName}
                onChange={handlePlaceSelect}
                placeholder="Search for a business..."
                types={["establishment"]}
                fetchDetails={true}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Search Google Places or enter details manually below
              </p>
            </div>

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

            {/* Street Address */}
            <div>
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            {/* City, State and Zip in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cityState">City, State *</Label>
                <Input
                  id="cityState"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="Denver, CO"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="80202"
                />
              </div>
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
              <p className="text-xs text-muted-foreground mt-1">
                Used for the short URL (e.g., /4255779060)
              </p>
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

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/admin/merchants">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Page
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
