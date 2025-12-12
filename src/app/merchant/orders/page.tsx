"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  Copy,
  Check,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
  Package,
  DollarSign,
  AlertCircle,
  Upload,
  Pencil,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const LOCAL_CITY_PLACES_ZELLE = "troywarren@localcityplaces.com";

interface Order {
  id: string;
  denomination: number;
  quantity: number;
  totalCost: string;
  paymentMethod: "zelle" | "business_check";
  paymentStatus: "pending" | "confirmed" | "failed";
  zelleAccountName: string | null;
  rejectionReason: string | null;
  createdAt: string;
  paymentConfirmedAt: string | null;
}

interface BankAccount {
  bankName: string | null;
  accountHolderName: string;
  routingLast4: string;
  accountLast4: string;
  hasCheckImage: boolean;
}

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [zelleCopied, setZelleCopied] = useState(false);

  // Bank account modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [checkImagePreview, setCheckImagePreview] = useState<string | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/merchant/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setBankAccount(data.bankAccount);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchOrders();
    }
  }, [loading, isAuthenticated]);

  const copyZelleId = async () => {
    try {
      await navigator.clipboard.writeText(LOCAL_CITY_PLACES_ZELLE);
      setZelleCopied(true);
      setTimeout(() => setZelleCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const openBankModal = () => {
    // Pre-fill if editing
    if (bankAccount) {
      setBankName(bankAccount.bankName || "");
      setAccountHolderName(bankAccount.accountHolderName || "");
      setRoutingNumber("");
      setAccountNumber("");
    } else {
      setBankName("");
      setAccountHolderName("");
      setRoutingNumber("");
      setAccountNumber("");
    }
    setCheckImage(null);
    setCheckImagePreview(null);
    setBankError(null);
    setShowBankModal(true);
  };

  const handleCheckImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCheckImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCheckImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBankAccount = async () => {
    setBankError(null);

    // Validation
    if (!bankName.trim()) {
      setBankError("Bank name is required");
      return;
    }
    if (!accountHolderName.trim()) {
      setBankError("Account holder name is required");
      return;
    }
    // Only require routing/account if adding new or updating numbers
    if (!bankAccount && (!routingNumber || routingNumber.length !== 9)) {
      setBankError("Valid 9-digit routing number is required");
      return;
    }
    if (!bankAccount && (!accountNumber || accountNumber.length < 4)) {
      setBankError("Valid account number is required");
      return;
    }
    // Require check image if adding new or if they don't have one
    if (!bankAccount?.hasCheckImage && !checkImage) {
      setBankError("Check image is required for verification");
      return;
    }

    setIsSavingBank(true);

    try {
      // Upload check image first if provided
      let checkImageUrl: string | null = null;
      if (checkImage) {
        const formData = new FormData();
        formData.append("file", checkImage);
        formData.append("type", "check");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload check image");
        }

        const uploadData = await uploadRes.json();
        checkImageUrl = uploadData.url;
      }

      // Save bank account
      const res = await fetch("/api/merchant/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          accountHolderName,
          routingNumber: routingNumber || undefined,
          accountNumber: accountNumber || undefined,
          checkImageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save bank account");
      }

      setShowBankModal(false);
      fetchOrders(); // Refresh to get updated bank info
    } catch (error) {
      setBankError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSavingBank(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.paymentStatus === "pending");
  const completedOrders = orders.filter((o) => o.paymentStatus === "confirmed");
  const rejectedOrders = orders.filter((o) => o.paymentStatus === "failed");

  const totalPending = pendingOrders.reduce((sum, o) => sum + parseFloat(o.totalCost), 0);
  const totalApproved = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalCost), 0);
  const totalGRCs = completedOrders.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
        <div className="max-w-4xl">
          <PageHeader
            title="My Orders"
            description="View your GRC purchase history and payment details"
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium">Total Orders</span>
              </div>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">GRCs Received</span>
              </div>
              <p className="text-2xl font-bold">{totalGRCs}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold">${totalPending.toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Total Spent</span>
              </div>
              <p className="text-2xl font-bold">${totalApproved.toFixed(0)}</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Payment Methods
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zelle Card */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Zelle</h3>
                    <p className="text-xs text-muted-foreground">Instant transfer</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Send payments to:
                </p>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-3 border border-border">
                  <code className="flex-1 text-sm font-mono truncate">{LOCAL_CITY_PLACES_ZELLE}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyZelleId}
                    className="shrink-0"
                  >
                    {zelleCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Business Check Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Business Check</h3>
                      <p className="text-xs text-muted-foreground">Bank account on file</p>
                    </div>
                  </div>
                  {bankAccount && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={openBankModal}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {bankAccount ? (
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 border border-border">
                    <p className="font-medium text-sm">{bankAccount.accountHolderName}</p>
                    {bankAccount.bankName && (
                      <p className="text-sm text-muted-foreground">{bankAccount.bankName}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      ****{bankAccount.accountLast4}
                    </p>
                    {bankAccount.hasCheckImage ? (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Check image on file
                      </p>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Check image required
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openBankModal}
                          className="text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Upload Check Image
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 border border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      No bank account on file
                    </p>
                    <Button
                      size="sm"
                      onClick={openBankModal}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Add Bank Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Order History
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoadingOrders}
              >
                <RefreshCw className={cn("w-4 h-4", isLoadingOrders && "animate-spin")} />
              </Button>
              <Button size="sm" onClick={() => router.push("/merchant/purchase")}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>

          {isLoadingOrders ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Purchase GRCs to see your order history here"
              action={
                <Button onClick={() => router.push("/merchant/purchase")}>
                  Purchase GRCs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Pending Orders - Highlighted */}
              {pendingOrders.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <h3 className="font-medium text-yellow-700 dark:text-yellow-400">
                      Awaiting Payment Verification ({pendingOrders.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {pendingOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onCopyZelle={copyZelleId}
                        zelleCopied={zelleCopied}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Approved
                  </h3>
                  <div className="space-y-2">
                    {completedOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Orders */}
              {rejectedOrders.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Rejected
                  </h3>
                  <div className="space-y-2">
                    {rejectedOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Account Modal */}
          <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {bankAccount ? "Edit Bank Account" : "Add Bank Account"}
                </DialogTitle>
                <DialogDescription>
                  Enter your bank details for Business Check payments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank-name">Bank Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="bank-name"
                    placeholder="Chase, Bank of America, etc."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="account-holder">Account Holder Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="account-holder"
                    placeholder="Business or Personal Name"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="routing">
                      Routing Number {!bankAccount && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="routing"
                      placeholder={bankAccount ? `****${bankAccount.routingLast4}` : "123456789"}
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="mt-1 font-mono"
                      maxLength={9}
                    />
                    {bankAccount && (
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="account">
                      Account Number {!bankAccount && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="account"
                      placeholder={bankAccount ? `****${bankAccount.accountLast4}` : "1234567890"}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))}
                      className="mt-1 font-mono"
                      maxLength={17}
                    />
                    {bankAccount && (
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>
                    Check Image {!bankAccount?.hasCheckImage && <span className="text-destructive">*</span>}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload a photo of a check from this account for verification
                  </p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      checkImagePreview
                        ? "border-green-500 bg-green-500/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {checkImagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={checkImagePreview}
                          alt="Check preview"
                          className="max-h-24 mx-auto rounded"
                        />
                        <p className="text-sm text-green-600">New check image selected</p>
                      </div>
                    ) : bankAccount?.hasCheckImage ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
                        <p className="text-sm text-muted-foreground">Check image on file</p>
                        <p className="text-xs text-muted-foreground">Click to upload a new one</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a photo of a check
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCheckImageChange}
                    className="hidden"
                  />
                </div>

                {bankError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{bankError}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBankModal(false)}
                  disabled={isSavingBank}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveBankAccount} disabled={isSavingBank}>
                  {isSavingBank ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Bank Account"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardLayout>
  );
}

function OrderCard({
  order,
  onCopyZelle,
  zelleCopied,
}: {
  order: Order;
  onCopyZelle?: () => void;
  zelleCopied?: boolean;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPending = order.paymentStatus === "pending";
  const isApproved = order.paymentStatus === "confirmed";
  const isRejected = order.paymentStatus === "failed";

  return (
    <div className={cn(
      "bg-card rounded-lg border p-4 transition-all",
      isPending && "border-yellow-500/30",
      isApproved && "border-border",
      isRejected && "border-red-500/30 bg-red-500/5"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: Order Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isPending && "bg-yellow-500/10",
            isApproved && "bg-green-500/10",
            isRejected && "bg-red-500/10"
          )}>
            {isPending && <Clock className="w-6 h-6 text-yellow-600" />}
            {isApproved && <CheckCircle2 className="w-6 h-6 text-green-600" />}
            {isRejected && <XCircle className="w-6 h-6 text-red-600" />}
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">
                {order.quantity}x ${order.denomination} GRC
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                isPending && "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
                isApproved && "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
                isRejected && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
              )}>
                {isPending && "Pending"}
                {isApproved && "Approved"}
                {isRejected && "Rejected"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>{formatTime(order.createdAt)}</span>
              {order.paymentMethod === "zelle" ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Zelle
                  </span>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Check
                  </span>
                </>
              )}
            </div>
            {isRejected && order.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">
                {order.rejectionReason}
              </p>
            )}
          </div>
        </div>

        {/* Right: Amount + Action */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <p className="text-xl font-bold">
            ${parseFloat(order.totalCost).toFixed(2)}
          </p>
          {isPending && order.paymentMethod === "zelle" && onCopyZelle && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCopyZelle}
              className="text-xs"
            >
              {zelleCopied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Zelle
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
