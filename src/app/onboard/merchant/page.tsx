"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Store,
  Mail,
  MapPin,
  Phone,
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Gift,
} from "lucide-react";
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete";

interface Category {
  id: string;
  name: string;
}

type Step = "validating" | "invalid" | "form" | "submitting" | "success";

function MerchantOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Step state
  const [step, setStep] = useState<Step>("validating");
  const [error, setError] = useState("");

  // Pre-filled from invite
  const [prefilledEmail, setPrefilledEmail] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [googlePlaceName, setGooglePlaceName] = useState("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Result
  const [magicToken, setMagicToken] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStep("invalid");
      setError("No invitation token provided");
      return;
    }

    validateToken();
  }, [token]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/onboard/validate-invite?token=${token}`);
      const data = await res.json();

      if (data.valid) {
        setStep("form");
        if (data.email) {
          setPrefilledEmail(data.email);
          setEmail(data.email);
        }
      } else {
        setStep("invalid");
        setError(data.error || "Invalid invitation");
      }
    } catch (err) {
      setStep("invalid");
      setError("Failed to validate invitation");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleGooglePlaceSelect = (name: string, placeId: string) => {
    setGooglePlaceName(name);
    setGooglePlaceId(placeId);
    // Try to extract business name from the place
    if (name && !businessName) {
      // Get the main part of the name (before the address)
      const mainName = name.split(",")[0];
      setBusinessName(mainName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !businessName) {
      return;
    }

    setStep("submitting");
    setError("");

    try {
      const res = await fetch("/api/onboard/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          businessName,
          city: city || undefined,
          categoryId: categoryId || undefined,
          phone: phone || undefined,
          website: website || undefined,
          description: description || undefined,
          googlePlaceId: googlePlaceId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMagicToken(data.magicToken);
        setStep("success");
      } else {
        setError(data.error || "Failed to complete registration");
        setStep("form");
      }
    } catch (err) {
      setError("Failed to complete registration");
      setStep("form");
    }
  };

  const handleGoToDashboard = () => {
    // Use the magic token to auto-login
    window.location.href = `/api/auth/verify?token=${magicToken}`;
  };

  // Validating state
  if (step === "validating") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Validating your invitation...</h2>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (step === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Local City Places!</h1>
          <p className="text-muted-foreground mb-6">
            Your merchant account has been created and you have 10 free trial GRCs ready to issue!
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-800 font-medium mb-1">
              <Gift className="w-5 h-5" />
              10 Trial GRCs
            </div>
            <p className="text-green-700 text-sm">
              Each worth $100 - that's $1,000 in value for your customers!
            </p>
          </div>

          <Button onClick={handleGoToDashboard} className="w-full">
            Go to Your Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Local City Places</h1>
          <h2 className="text-xl font-semibold mb-2">Become a Merchant Partner</h2>
          <p className="text-muted-foreground">
            Complete your registration to receive 10 free trial GRCs ($1,000 value)
          </p>
        </div>

        {/* Trial GRCs Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Your trial includes:</p>
              <p className="text-sm text-green-700">
                10 Grocery Rebate Certificates at $100 each - give them to your customers!
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Places Search */}
            <div>
              <Label htmlFor="google-search">Search for Your Business (optional)</Label>
              <GooglePlacesAutocomplete
                value={googlePlaceName}
                onChange={handleGooglePlaceSelect}
                placeholder="Search by business name..."
                types={["establishment"]}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find your business to auto-fill details, or enter manually below
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Business Information</h3>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!prefilledEmail}
                    required
                  />
                  {prefilledEmail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Email was pre-filled from your invitation
                    </p>
                  )}
                </div>

                {/* Business Name */}
                <div>
                  <Label htmlFor="businessName">
                    <Store className="w-4 h-4 inline mr-2" />
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="Acme Coffee Shop"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                {/* City & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      City
                    </Label>
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
                </div>

                {/* Phone & Website Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Business Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Tell your customers about your business..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={step === "submitting" || !email || !businessName}
            >
              {step === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating your account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By registering, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MerchantOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading...</h2>
          </div>
        </div>
      }
    >
      <MerchantOnboardingContent />
    </Suspense>
  );
}
