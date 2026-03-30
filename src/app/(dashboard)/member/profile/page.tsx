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
import { Camera, Loader2, Save, User } from "lucide-react";
import { memberNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";

interface ProfileData {
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  notificationPrefs: {
    emailReceipts: boolean;
    emailReminders: boolean;
    emailMarketing: boolean;
  };
  firstName: string;
  lastName: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export default function MemberProfilePage() {
  const router = useRouter();
  const { user, userName, isLoading: authLoading, isAuthenticated, mutate } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "member" && user?.role !== "admin"))) {
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
      const response = await fetch("/api/member/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      // Format phone number for display
      if (data.profile.phone) {
        data.profile.phone = formatPhoneNumber(data.profile.phone);
      }
      setProfile(data.profile);
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
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: stripPhoneNumber(profile.phone || ""),
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        notificationPrefs: profile.notificationPrefs,
      };

      if (pendingPhoto) {
        payload.profilePhoto = pendingPhoto;
      }

      const response = await fetch("/api/member/profile", {
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
      setPendingPhoto(null);
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
    reader.onload = () => {
      setPendingPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : "";
  const displayPhoto = pendingPhoto || profile?.profilePhotoUrl;

  return (
    <DashboardLayout navItems={memberNavItems}>
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !profile ? (
        <Card className="max-w-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Failed to load profile</p>
            <Button onClick={fetchProfile} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
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

          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>
                This photo will appear in the header and on your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={displayPhoto || undefined} />
                  <AvatarFallback className="text-2xl">
                    {initials || <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
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

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your name and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => updateField("phone", formatPhoneNumber(e.target.value))}
                  placeholder="(425) 451-8599"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mailing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Mailing Address</CardTitle>
              <CardDescription>
                Used for sending monthly gift card rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={profile.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state || ""}
                    onChange={(e) => updateField("state", e.target.value)}
                    maxLength={2}
                    placeholder="TX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={profile.zip || ""}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="12345"
                  />
                </div>
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
                  <p className="font-medium">Receipt Confirmations</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when receipts are approved or rejected
                  </p>
                </div>
                <Switch
                  checked={profile.notificationPrefs.emailReceipts}
                  onCheckedChange={(checked) =>
                    updateNotificationPref("emailReceipts", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Monthly Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Reminder to upload receipts before month end
                  </p>
                </div>
                <Switch
                  checked={profile.notificationPrefs.emailReminders}
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
                    News about new merchants and special offers
                  </p>
                </div>
                <Switch
                  checked={profile.notificationPrefs.emailMarketing}
                  onCheckedChange={(checked) =>
                    updateNotificationPref("emailMarketing", checked)
                  }
                />
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
