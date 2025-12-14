"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  ArrowLeft,
  Loader2,
  Save,
  Receipt,
  Mail,
  Gift,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Trials", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface UserDetail {
  id: string;
  email: string;
  phone: string | null;
  role: "member" | "merchant" | "admin";
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  homeCity: string | null;
}

interface MerchantDetail {
  id: string;
  businessName: string;
  categoryId: string | null;
  city: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  hasTrialGrcs: boolean;
}

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User data
  const [user, setUser] = useState<UserDetail | null>(null);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);

  // Trial GRC dialog state
  const [showTrialGrcDialog, setShowTrialGrcDialog] = useState(false);
  const [selectedDenomination, setSelectedDenomination] = useState("100");
  const [settingTrialGrcs, setSettingTrialGrcs] = useState(false);
  const [trialGrcError, setTrialGrcError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    // User fields
    email: "",
    phone: "",
    role: "member" as "member" | "merchant" | "admin",
    // Member fields
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    homeCity: "",
    // Merchant fields
    businessName: "",
    merchantCity: "",
    merchantPhone: "",
    website: "",
    description: "",
    verified: false,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || authUser?.role !== "admin")) {
      router.push("/");
    } else if (!authLoading && isAuthenticated) {
      fetchUser();
    }
  }, [authLoading, isAuthenticated, authUser?.role, router, userId]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        setError("User not found");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setMember(data.member || null);
      setMerchant(data.merchant || null);

      // Initialize form data (format phone numbers for display)
      setFormData({
        email: data.user.email || "",
        phone: formatPhoneNumber(data.user.phone || ""),
        role: data.user.role || "member",
        firstName: data.member?.firstName || "",
        lastName: data.member?.lastName || "",
        address: data.member?.address || "",
        city: data.member?.city || "",
        state: data.member?.state || "",
        zip: data.member?.zip || "",
        homeCity: data.member?.homeCity || "",
        businessName: data.merchant?.businessName || "",
        merchantCity: data.merchant?.city || "",
        merchantPhone: formatPhoneNumber(data.merchant?.phone || ""),
        website: data.merchant?.website || "",
        description: data.merchant?.description || "",
        verified: data.merchant?.verified || false,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load user");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: formData.email,
            phone: stripPhoneNumber(formData.phone) || null,
            role: formData.role,
          },
          member: member ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
            homeCity: formData.homeCity || null,
          } : null,
          merchant: merchant ? {
            businessName: formData.businessName,
            city: formData.merchantCity || null,
            phone: stripPhoneNumber(formData.merchantPhone) || null,
            website: formData.website || null,
            description: formData.description || null,
            verified: formData.verified,
          } : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
        setSaving(false);
        return;
      }

      router.push("/admin/users");
    } catch (err) {
      console.error("Error saving user:", err);
      setError("Failed to save changes");
      setSaving(false);
    }
  };

  const handleSetTrialGrcs = async () => {
    if (!merchant) return;

    setSettingTrialGrcs(true);
    setTrialGrcError("");

    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/trial-grcs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denomination: parseInt(selectedDenomination) }),
      });

      if (res.ok) {
        // Update local state
        setMerchant({ ...merchant, hasTrialGrcs: true });
        setShowTrialGrcDialog(false);
      } else {
        const data = await res.json();
        setTrialGrcError(data.error || "Failed to set trial GRCs");
      }
    } catch (err) {
      console.error("Error setting trial GRCs:", err);
      setTrialGrcError("Failed to set trial GRCs");
    } finally {
      setSettingTrialGrcs(false);
    }
  };

  const getInitials = (): string => {
    if (member?.firstName && member?.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    if (merchant?.businessName) {
      return merchant.businessName.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "??";
  };

  const isSelf = authUser?.email === user?.email;

  return (
    <DashboardLayout navItems={adminNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error && !user ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <PageHeader
              title="Edit User"
              description={user?.email || ""}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid gap-6 max-w-3xl">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profilePhotoUrl || undefined} />
                    <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>
                      User ID: {user?.id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="(425) 451-8599"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as "member" | "merchant" | "admin" })}
                    disabled={isSelf}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="merchant">Merchant</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">You cannot change your own role</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Profile Card */}
            {member && (
              <Card>
                <CardHeader>
                  <CardTitle>Member Profile</CardTitle>
                  <CardDescription>Personal information and address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeCity">Home City (for GRC matching)</Label>
                    <Input
                      id="homeCity"
                      value={formData.homeCity}
                      onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Merchant Profile Card */}
            {merchant && (
              <Card>
                <CardHeader>
                  <CardTitle>Merchant Profile</CardTitle>
                  <CardDescription>Business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trial GRCs Alert */}
                  {!merchant.hasTrialGrcs && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Trial GRCs Not Set Up</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This merchant hasn&apos;t received their trial GRCs yet.
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => setShowTrialGrcDialog(true)} size="sm">
                          <Gift className="w-4 h-4 mr-2" />
                          Set Trial GRCs
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchantCity">City</Label>
                      <Input
                        id="merchantCity"
                        value={formData.merchantCity}
                        onChange={(e) => setFormData({ ...formData, merchantCity: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="merchantPhone">Business Phone</Label>
                      <Input
                        id="merchantPhone"
                        type="tel"
                        value={formData.merchantPhone}
                        onChange={(e) => setFormData({ ...formData, merchantPhone: formatPhoneNumber(e.target.value) })}
                        placeholder="(425) 451-8599"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="verified">Verified Merchant</Label>
                      <p className="text-xs text-muted-foreground">
                        Mark this merchant as verified
                      </p>
                    </div>
                    <Switch
                      id="verified"
                      checked={formData.verified}
                      onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Set Trial GRCs Dialog */}
      <Dialog open={showTrialGrcDialog} onOpenChange={setShowTrialGrcDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Trial GRCs</DialogTitle>
            <DialogDescription>
              Give {merchant?.businessName} their free trial GRCs. They will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="trial-denomination">Denomination</Label>
            <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
              <SelectTrigger id="trial-denomination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">$100 each (10 x $100 = $1,000 value)</SelectItem>
                <SelectItem value="75">$75 each (10 x $75 = $750 value)</SelectItem>
                <SelectItem value="50">$50 each (10 x $50 = $500 value)</SelectItem>
                <SelectItem value="25">$25 each (10 x $25 = $250 value)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Trial GRCs are free for the merchant to issue to their customers
            </p>
          </div>
          {trialGrcError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
              {trialGrcError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrialGrcDialog(false)} disabled={settingTrialGrcs}>
              Cancel
            </Button>
            <Button onClick={handleSetTrialGrcs} disabled={settingTrialGrcs}>
              {settingTrialGrcs ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Activate Trial GRCs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
