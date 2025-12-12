"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, Save, Building2, CheckCircle, CreditCard, Lock, Upload, FileCheck, X } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";

interface Category {
  id: string;
  name: string;
}

interface ProfileData {
  email: string;
  profilePhotoUrl: string | null;
  notificationPrefs: {
    emailReceipts: boolean;
    emailReminders: boolean;
    emailMarketing: boolean;
  };
  businessName: string;
  categoryId: string | null;
  categoryName: string | null;
  city: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  bankAccount: {
    bankName: string | null;
    accountHolderName: string;
    routingLast4: string;
    accountLast4: string;
    hasCheckImage: boolean;
    hasAccount: boolean;
  } | null;
}

export default function MerchantProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, mutate } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  // Payment info state (for bank account details that need separate input)
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isEditingBankAccount, setIsEditingBankAccount] = useState(false);
  const checkImageInputRef = useRef<HTMLInputElement>(null);
  const [checkImagePreview, setCheckImagePreview] = useState<string | null>(null);
  const [checkImageUrl, setCheckImageUrl] = useState<string | null>(null);
  const [isUploadingCheck, setIsUploadingCheck] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated]);

  async function fetchProfile() {
    try {
      const response = await fetch("/api/merchant/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data.profile);
      setCategories(data.categories);
      // Initialize bank account fields if exists
      if (data.profile.bankAccount) {
        setBankAccountName(data.profile.bankAccount.accountHolderName || "");
        setBankName(data.profile.bankAccount.bankName || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!profile) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        businessName: profile.businessName,
        categoryId: profile.categoryId,
        city: profile.city,
        description: profile.description,
        phone: profile.phone,
        website: profile.website,
        notificationPrefs: profile.notificationPrefs,
      };

      // Include bank account if editing with new details
      if (bankRouting && bankAccount) {
        payload.bankAccount = {
          bankName: bankName,
          accountHolderName: bankAccountName,
          routingNumber: bankRouting,
          accountNumber: bankAccount,
          checkImageUrl: checkImageUrl || undefined,
        };
      } else if (checkImageUrl && profile?.bankAccount?.hasAccount) {
        // Just updating check image for existing account
        payload.bankAccount = {
          checkImageUrl: checkImageUrl,
        };
      }

      if (pendingPhoto) {
        payload.profilePhoto = pendingPhoto;
      }
      if (pendingLogo) {
        payload.logo = pendingLogo;
      }

      const response = await fetch("/api/merchant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      const data = await response.json();
      if (data.profilePhotoUrl) {
        setProfile((prev) =>
          prev ? { ...prev, profilePhotoUrl: data.profilePhotoUrl } : null
        );
        // Revalidate user data to update header
        mutate();
      }
      if (data.logoUrl) {
        setProfile((prev) =>
          prev ? { ...prev, logoUrl: data.logoUrl } : null
        );
      }
      setPendingPhoto(null);
      setPendingLogo(null);
      // Reset bank account editing state
      if (bankRouting && bankAccount) {
        setProfile((prev) =>
          prev ? {
            ...prev,
            bankAccount: {
              bankName,
              accountHolderName: bankAccountName,
              routingLast4: bankRouting.slice(-4),
              accountLast4: bankAccount.slice(-4),
              hasCheckImage: !!checkImageUrl || prev.bankAccount?.hasCheckImage || false,
              hasAccount: true,
            }
          } : null
        );
        setBankRouting("");
        setBankAccount("");
        setIsEditingBankAccount(false);
      } else if (checkImageUrl && profile?.bankAccount?.hasAccount) {
        // Just updated check image
        setProfile((prev) =>
          prev && prev.bankAccount ? {
            ...prev,
            bankAccount: {
              ...prev.bankAccount,
              hasCheckImage: true,
            }
          } : prev
        );
      }
      // Clear check image state
      setCheckImagePreview(null);
      setCheckImageUrl(null);
      setMessage({ type: "success", text: "Profile saved successfully" });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save profile",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPendingPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPendingLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCheckImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setCheckImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingCheck(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "check");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setCheckImageUrl(data.url);
    } catch (error) {
      console.error("Check upload error:", error);
      setMessage({ type: "error", text: "Failed to upload check image" });
      setCheckImagePreview(null);
    } finally {
      setIsUploadingCheck(false);
    }
  }

  function updateField<K extends keyof ProfileData>(field: K, value: ProfileData[K]) {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  }

  function updateNotificationPref(key: keyof ProfileData["notificationPrefs"], value: boolean) {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            notificationPrefs: {
              ...prev.notificationPrefs,
              [key]: value,
            },
          }
        : null
    );
  }

  const userName = profile?.businessName;

  const initials = profile
    ? profile.businessName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";
  const displayPhoto = pendingPhoto || profile?.profilePhotoUrl;
  const displayLogo = pendingLogo || profile?.logoUrl;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {authLoading ? null : (
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Business Profile</h1>
              <p className="text-muted-foreground">
                Manage your business information and preferences
              </p>
            </div>
            {profile?.verified && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Business Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Business Logo</CardTitle>
              <CardDescription>
                This appears on your public profile and GRCs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 rounded-lg">
                  <AvatarImage src={displayLogo || undefined} className="object-cover" />
                  <AvatarFallback className="text-2xl rounded-lg">
                    {initials || <Building2 className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {displayLogo ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {pendingLogo && (
                    <p className="text-sm text-muted-foreground">
                      New logo selected - save to apply
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile Photo</CardTitle>
              <CardDescription>
                Your personal photo shown in the header
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={displayPhoto || undefined} />
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {displayPhoto ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {pendingPhoto && (
                    <p className="text-sm text-muted-foreground">
                      New photo selected - save to apply
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Details shown to members on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={profile?.businessName || ""}
                  onChange={(e) => updateField("businessName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={profile?.categoryId || undefined}
                    onValueChange={(value) => updateField("categoryId", value)}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile?.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={profile?.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Tell members about your business..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile?.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile?.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Account Email</Label>
                <Input id="email" value={profile?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">GRC Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications when GRCs are claimed or completed
                  </p>
                </div>
                <Switch
                  checked={profile?.notificationPrefs?.emailReceipts ?? false}
                  onCheckedChange={(checked) =>
                    updateNotificationPref("emailReceipts", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Member Activity</p>
                  <p className="text-sm text-muted-foreground">
                    Updates about member engagement and reviews
                  </p>
                </div>
                <Switch
                  checked={profile?.notificationPrefs?.emailReminders ?? false}
                  onCheckedChange={(checked) =>
                    updateNotificationPref("emailReminders", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Tips and best practices for merchants
                  </p>
                </div>
                <Switch
                  checked={profile?.notificationPrefs?.emailMarketing ?? false}
                  onCheckedChange={(checked) =>
                    updateNotificationPref("emailMarketing", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Bank account details for Business Check payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium">Bank Account for Business Check</h4>
                </div>

                {profile?.bankAccount?.hasAccount && !isEditingBankAccount ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{profile.bankAccount.accountHolderName}</p>
                          {profile.bankAccount.bankName && (
                            <p className="text-sm text-muted-foreground">{profile.bankAccount.bankName}</p>
                          )}
                          <p className="text-sm text-muted-foreground font-mono">
                            Routing: ****{profile.bankAccount.routingLast4} | Account: ****{profile.bankAccount.accountLast4}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingBankAccount(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Update bank account details
                      </button>
                    </div>

                    {/* Check Image Section */}
                    <div className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Check Image</span>
                        </div>
                        {profile.bankAccount.hasCheckImage && !checkImagePreview && (
                          <Badge variant="secondary" className="text-green-600 bg-green-50">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            On file
                          </Badge>
                        )}
                      </div>

                      {checkImagePreview ? (
                        <div className="relative">
                          <img
                            src={checkImagePreview}
                            alt="Check preview"
                            className="w-full max-w-sm rounded-lg border"
                          />
                          {isUploadingCheck && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCheckImagePreview(null);
                              setCheckImageUrl(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {checkImageUrl && (
                            <p className="text-xs text-muted-foreground mt-2">
                              New check image ready - save to apply
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input
                            ref={checkImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCheckImageSelect}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkImageInputRef.current?.click()}
                            disabled={isUploadingCheck}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {profile.bankAccount.hasCheckImage ? "Replace Check Image" : "Upload Check Image"}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Upload a voided check or bank document showing your account info
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Chase, Bank of America, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Account Holder Name</Label>
                      <Input
                        id="bankAccountName"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="Business or Your Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankRouting">Routing Number</Label>
                        <Input
                          id="bankRouting"
                          value={bankRouting}
                          onChange={(e) => setBankRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                          placeholder="123456789"
                          className="font-mono"
                          maxLength={9}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
                          placeholder="••••••••1234"
                          className="font-mono"
                          maxLength={17}
                        />
                      </div>
                    </div>
                    {/* Check Image Upload in Edit Mode */}
                    <div className="space-y-2">
                      <Label>Check Image (optional)</Label>
                      {checkImagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={checkImagePreview}
                            alt="Check preview"
                            className="w-full max-w-xs rounded-lg border"
                          />
                          {isUploadingCheck && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCheckImagePreview(null);
                              setCheckImageUrl(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            ref={checkImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCheckImageSelect}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => checkImageInputRef.current?.click()}
                            disabled={isUploadingCheck}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Check Image
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a voided check or bank document
                      </p>
                    </div>
                    {profile?.bankAccount?.hasAccount && isEditingBankAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingBankAccount(false);
                          setBankRouting("");
                          setBankAccount("");
                          setCheckImagePreview(null);
                          setCheckImageUrl(null);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Bank details are encrypted and secure</span>
                </div>
              </div>

              <Separator />

              {/* Zelle Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium">Pay via Zelle</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  When purchasing GRCs with Zelle, send payment to:{" "}
                  <code className="px-1 py-0.5 bg-muted rounded text-foreground">troywarren@localcityplaces.com</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
