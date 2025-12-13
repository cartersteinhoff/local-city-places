"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { AnimatedFoodBackground } from "@/components/animated-food-background";

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
  const [cityState, setCityState] = useState(""); // Combined "City, ST" field
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
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleGooglePlaceSelect = (name: string, placeId: string, details?: PlaceDetails) => {
    setGooglePlaceName(name);
    setGooglePlaceId(placeId);

    if (details) {
      // Auto-populate form fields from place details
      if (details.name) {
        setBusinessName(details.name);
      }
      // Combine city and state into single field
      if (details.city || details.state) {
        const parts = [details.city, details.state].filter(Boolean);
        setCityState(parts.join(", "));
      }
      if (details.phone) {
        setPhone(formatPhoneNumber(details.phone));
      }
      if (details.website) {
        setWebsite(details.website);
      }
    } else if (name && !businessName) {
      // Fallback: extract business name from the place description
      const mainName = name.split(",")[0];
      setBusinessName(mainName);
    }
  };

  // Parse cityState into separate city and state values
  const parseCityState = (value: string): { city: string; state: string } => {
    const parts = value.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      // Last part is state, rest is city
      const state = parts[parts.length - 1].toUpperCase().slice(0, 2);
      const city = parts.slice(0, -1).join(", ");
      return { city, state };
    }
    // No comma - treat whole thing as city
    return { city: value.trim(), state: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !businessName) {
      return;
    }

    setStep("submitting");
    setError("");

    try {
      const { city, state } = parseCityState(cityState);
      const res = await fetch("/api/onboard/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          businessName,
          city: city || undefined,
          state: state || undefined,
          categoryId: categoryId || undefined,
          phone: stripPhoneNumber(phone) || undefined,
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
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedFoodBackground />
        <div className="relative z-10 text-center bg-white/90 dark:bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl dark:border p-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Validating your invitation...</h2>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (step === "invalid") {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedFoodBackground />
        <div className="relative z-10 max-w-md w-full bg-white/90 dark:bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl dark:border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
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
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedFoodBackground />
        <div className="relative z-10 max-w-md w-full bg-white/90 dark:bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl dark:border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Local City Places!</h1>
          <p className="text-muted-foreground mb-6">
            Your merchant account has been created and you have 10 free trial GRCs ready to issue!
          </p>

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200 font-medium mb-1">
              <Gift className="w-5 h-5" />
              10 Trial GRCs
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm">
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
    <div className="relative min-h-screen py-8 px-4">
      <AnimatedFoodBackground />
      <div className="relative z-10 max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/images/logo-horizontal.png"
            alt="Local City Places"
            width={220}
            height={55}
            priority
            className="mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-white dark:text-foreground">Become a Merchant Partner</h2>
        </div>

        {/* Trial GRCs Banner */}
        <div className="bg-green-50/95 dark:bg-green-950/95 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Your trial includes:</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                10 Grocery Rebate Certificates at $100 each - give them to your customers!
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/90 dark:bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl dark:border p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Places Search */}
            <div>
              <Label htmlFor="google-search">Search for Your Business (optional)</Label>
              <GooglePlacesAutocomplete
                value={googlePlaceName}
                onChange={handleGooglePlaceSelect}
                placeholder="Search by business name..."
                types={["establishment"]}
                fetchDetails={true}
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

                {/* City/State & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cityState">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      City, State
                    </Label>
                    <Input
                      id="cityState"
                      placeholder="City, State"
                      value={cityState}
                      onChange={(e) => setCityState(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category" className="w-full">
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
                      placeholder="(425) 451-8599"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
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
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
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
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <AnimatedFoodBackground />
          <div className="relative z-10 text-center bg-white/90 dark:bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl dark:border p-8">
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
