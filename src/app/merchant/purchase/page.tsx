"use client";

import { useEffect, useState, useRef } from "react";
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
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Copy,
  Check,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface PricingTier {
  denomination: number;
  costPerCert: number;
}

interface CartItem {
  denomination: number;
  quantity: number;
  costPerCert: number;
}

type PaymentMethod = "zelle" | "business_check" | null;

interface SavedBankAccount {
  bankName: string;
  accountHolderName: string;
  routingLast4: string;
  accountLast4: string;
  hasCheckImage: boolean;
}

interface PurchaseResult {
  id: string;
  denomination: number;
  quantity: number;
  totalCost: number;
  paymentMethod: string;
}

const LOCAL_CITY_PLACES_ZELLE = "troywarren@localcityplaces.com";

export default function PurchaseGrcsPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricing, setPricing] = useState<PricingTier[]>([]);
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchaseResults, setPurchaseResults] = useState<PurchaseResult[]>([]);

  // Add to cart form state
  const [selectedDenomination, setSelectedDenomination] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Zelle payment info
  const [zelleAccountName, setZelleAccountName] = useState("");
  const [zelleCopied, setZelleCopied] = useState(false);

  // Business check payment info
  const [savedBankAccount, setSavedBankAccount] = useState<SavedBankAccount | null>(null);
  const [useSavedBank, setUseSavedBank] = useState(true);
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [checkImagePreview, setCheckImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    fetch("/api/merchant/grcs/purchase")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing) {
          setPricing(data.pricing);
        }
        // Load saved payment info
        if (data.savedPaymentInfo) {
          const saved = data.savedPaymentInfo;
          if (saved.bankAccount) {
            setSavedBankAccount({
              bankName: saved.bankAccount.bankName || "",
              accountHolderName: saved.bankAccount.accountHolderName || "",
              routingLast4: saved.bankAccount.routingLast4 || "",
              accountLast4: saved.bankAccount.accountLast4 || "",
              hasCheckImage: saved.bankAccount.hasCheckImage || false,
            });
            setUseSavedBank(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  const copyZelleId = async () => {
    try {
      await navigator.clipboard.writeText(LOCAL_CITY_PLACES_ZELLE);
      setZelleCopied(true);
      setTimeout(() => setZelleCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
    }
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

  const addToCart = () => {
    if (!selectedDenomination || addQuantity < 1) return;
    const denom = parseInt(selectedDenomination);
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(denom) || 0;
      newCart.set(denom, Math.min(999, existing + addQuantity));
      return newCart;
    });
    setSelectedDenomination("");
    setAddQuantity(1);
  };

  const updateCartItem = (denomination: number, newQuantity: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      if (newQuantity <= 0) {
        newCart.delete(denomination);
      } else {
        newCart.set(denomination, Math.min(999, newQuantity));
      }
      return newCart;
    });
    setEditingItem(null);
  };

  const removeFromCart = (denomination: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.delete(denomination);
      return newCart;
    });
  };

  const startEditing = (denomination: number) => {
    setEditingItem(denomination);
    setEditQuantity(cart.get(denomination) || 1);
  };

  const getSelectedPricing = () => {
    if (!selectedDenomination) return null;
    return pricing.find((p) => p.denomination === parseInt(selectedDenomination));
  };

  const getCartItems = (): CartItem[] => {
    return Array.from(cart.entries())
      .map(([denomination, quantity]) => {
        const tier = pricing.find((p) => p.denomination === denomination);
        return {
          denomination,
          quantity,
          costPerCert: tier?.costPerCert || 0,
        };
      })
      .filter((item) => item.quantity > 0);
  };

  const getTotalItems = () => {
    return Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalCost = () => {
    return getCartItems().reduce(
      (sum, item) => sum + item.quantity * item.costPerCert,
      0
    );
  };

  const isPaymentInfoValid = () => {
    if (paymentMethod === "zelle") {
      return zelleAccountName.trim() !== "";
    }
    if (paymentMethod === "business_check") {
      // If using saved bank account with check image already on file
      if (useSavedBank && savedBankAccount?.hasCheckImage) {
        return true;
      }
      // If using saved bank but need to upload check image
      if (useSavedBank && savedBankAccount && !savedBankAccount.hasCheckImage) {
        return checkImage !== null;
      }
      // New bank account - need all fields + check image
      return (
        bankName.trim() !== "" &&
        routingNumber.trim().length === 9 &&
        accountNumber.trim().length >= 4 &&
        accountHolderName.trim() !== "" &&
        checkImage !== null
      );
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!paymentMethod || getCartItems().length === 0 || !isPaymentInfoValid()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload check image if provided
      let checkImageUrl: string | null = null;
      if (checkImage) {
        setIsUploadingImage(true);
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
        setIsUploadingImage(false);
      }

      const results: PurchaseResult[] = [];

      const cartEntries = Array.from(cart.entries());
      for (let i = 0; i < cartEntries.length; i++) {
        const [denomination, quantity] = cartEntries[i];
        const response = await fetch("/api/merchant/grcs/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            denomination,
            quantity,
            totalOrderQuantity: getTotalItems(),
            paymentMethod,
            paymentInfo:
              paymentMethod === "zelle"
                ? { zelleAccountName }
                : {
                    useSavedBank: useSavedBank && savedBankAccount !== null,
                    bankName: useSavedBank ? undefined : bankName,
                    routingNumber: useSavedBank ? undefined : routingNumber,
                    accountNumber: useSavedBank ? undefined : accountNumber,
                    accountHolderName: useSavedBank ? undefined : accountHolderName,
                    checkImageUrl: checkImageUrl,
                  },
            // Save bank info on first item if new bank details provided
            saveBankInfo: i === 0 && paymentMethod === "business_check" && !useSavedBank,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to place order");
        }

        results.push(data.purchase);
      }

      setPurchaseResults(results);
      setPurchaseComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  const MIN_ORDER_QUANTITY = 50;
  const canCheckout = getTotalItems() >= MIN_ORDER_QUANTITY && paymentMethod !== null && isPaymentInfoValid();

  if (purchaseComplete) {
    return (
      <DashboardLayout navItems={merchantNavItems}>
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Submitted!</h1>
            <p className="text-muted-foreground">
              Your GRC purchase order has been received and is pending payment verification.
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {purchaseResults.map((result) => (
                <div key={result.id} className="flex justify-between text-sm">
                  <span>
                    ${result.denomination} GRC x {result.quantity}
                  </span>
                  <span className="font-medium">${result.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  ${purchaseResults.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {paymentMethod === "zelle" && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Send Your Zelle Payment
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Please send your payment of <strong>${purchaseResults.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}</strong> to:
              </p>
              <div className="bg-card rounded-lg p-3 flex items-center justify-between">
                <code className="text-sm font-mono">{LOCAL_CITY_PLACES_ZELLE}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyZelleId}
                >
                  {zelleCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Once we verify your payment, your GRCs will be added to your inventory.
              </p>
            </div>
          )}

          {paymentMethod === "business_check" && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Payment Processing
              </h2>
              <p className="text-sm text-muted-foreground">
                Your business check payment of <strong>${purchaseResults.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}</strong> is being processed.
                Once verified, your GRCs will be added to your inventory.
              </p>
            </div>
          )}

          {/* What Happens Next */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="font-semibold mb-4">What Happens Next</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Payment Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Our accounting team will verify your payment.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">GRCs Added</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, your GRCs will appear in your inventory.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Start Issuing</p>
                  <p className="text-sm text-muted-foreground">
                    Issue GRCs to your customers from the Issue GRC page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPurchaseComplete(false);
                setCart(new Map());
                setPaymentMethod(null);
                setPurchaseResults([]);
                setZelleAccountName("");
                setCheckImage(null);
                setCheckImagePreview(null);
              }}
            >
              Purchase More GRCs
            </Button>
            <Button className="flex-1" onClick={() => router.push("/merchant")}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
        <>
          <PageHeader
            title="Purchase GRCs"
            description="Add grocery rebate certificates to your inventory to issue to customers"
          />

          <div className="max-w-2xl space-y-6">
            {/* Add GRCs Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-1">Add GRCs</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select a denomination and quantity to add to your order (minimum {MIN_ORDER_QUANTITY} GRCs per order)
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Denomination Select */}
                <div className="flex-1">
                  <Label htmlFor="denomination" className="text-xs text-muted-foreground mb-1.5 block">
                    GRC Value
                  </Label>
                  <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricing.map((tier) => (
                        <SelectItem key={tier.denomination} value={tier.denomination.toString()}>
                          ${tier.denomination} GRC
                          <span className="text-muted-foreground ml-2">
                            (${tier.costPerCert.toFixed(2)} each)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-28">
                  <Label htmlFor="quantity" className="text-xs text-muted-foreground mb-1.5 block">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={999}
                    className="text-center"
                  />
                </div>

                {/* Add Button */}
                <div className="flex items-end">
                  <Button
                    onClick={addToCart}
                    disabled={!selectedDenomination || addQuantity < 1}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>

              {/* Price Preview */}
              {selectedDenomination && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {addQuantity}x ${selectedDenomination} GRC
                  </span>
                  <span className="font-medium">
                    ${((getSelectedPricing()?.costPerCert || 0) * addQuantity).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-4">Your Cart {getCartItems().length > 0 && `(${getCartItems().length} ${getCartItems().length === 1 ? "item" : "items"})`}</h2>

              {getCartItems().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items in cart. Add GRCs above to get started.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {getCartItems().map((item) => (
                    <div
                      key={item.denomination}
                      className="py-3 flex items-center gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">${item.denomination} GRC</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.costPerCert.toFixed(2)} each
                        </div>
                      </div>

                      {editingItem === item.denomination ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 h-8 text-center text-sm"
                            min={1}
                            max={999}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateCartItem(item.denomination, editQuantity)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-center min-w-[60px]">
                            <div className="text-sm text-muted-foreground">Qty</div>
                            <div className="font-medium">{item.quantity}</div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-sm text-muted-foreground">Subtotal</div>
                            <div className="font-medium">
                              ${(item.quantity * item.costPerCert).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEditing(item.denomination)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.denomination)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Cart Total */}
                  <div className="pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total ({getTotalItems()} GRCs)</span>
                      <span className="text-xl font-bold">${getTotalCost().toFixed(2)}</span>
                    </div>
                    {getTotalItems() < MIN_ORDER_QUANTITY && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200">
                        <p className="text-sm font-medium">
                          Minimum order: {MIN_ORDER_QUANTITY} GRCs
                        </p>
                        <p className="text-sm mt-0.5">
                          Add {MIN_ORDER_QUANTITY - getTotalItems()} more GRC{MIN_ORDER_QUANTITY - getTotalItems() !== 1 ? "s" : ""} to continue to payment
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {getCartItems().length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6 relative">
                {getTotalItems() < MIN_ORDER_QUANTITY && (
                  <div className="absolute inset-0 bg-card/80 backdrop-blur-[1px] rounded-xl z-10 flex flex-col items-center justify-center gap-2">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Add {MIN_ORDER_QUANTITY - getTotalItems()} more GRC{MIN_ORDER_QUANTITY - getTotalItems() !== 1 ? "s" : ""} to unlock payment
                    </p>
                  </div>
                )}
                <h3 className="font-semibold mb-4">Payment Method</h3>

                <div className="space-y-3">
                  {/* Zelle Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("zelle")}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                      paymentMethod === "zelle"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                        paymentMethod === "zelle" ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <CreditCard
                        className={cn(
                          "w-5 h-5",
                          paymentMethod === "zelle" ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Pay by Zelle</div>
                      <div className="text-sm text-muted-foreground">Send payment via Zelle</div>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentMethod === "zelle"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {paymentMethod === "zelle" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Zelle Form Fields */}
                  {paymentMethod === "zelle" && (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Send your Zelle payment to:</p>
                        <div className="flex items-center gap-2 bg-card rounded-md p-3 border">
                          <code className="flex-1 text-sm font-mono">{LOCAL_CITY_PLACES_ZELLE}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyZelleId}
                            className="shrink-0"
                          >
                            {zelleCopied ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zelle-account-name" className="text-sm">
                          Name on your bank account <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          This helps us match your Zelle payment
                        </p>
                        <Input
                          id="zelle-account-name"
                          type="text"
                          placeholder="John Smith or Business Name"
                          value={zelleAccountName}
                          onChange={(e) => setZelleAccountName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Check Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("business_check")}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                      paymentMethod === "business_check"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                        paymentMethod === "business_check" ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Building2
                        className={cn(
                          "w-5 h-5",
                          paymentMethod === "business_check" ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Pay by Business Check</div>
                      <div className="text-sm text-muted-foreground">Provide bank account details</div>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentMethod === "business_check"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {paymentMethod === "business_check" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Business Check Form Fields */}
                  {paymentMethod === "business_check" && (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-4">
                      {savedBankAccount ? (
                        <>
                          {/* Use Saved Bank Account */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium">{savedBankAccount.accountHolderName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {savedBankAccount.bankName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Account ending in {savedBankAccount.accountLast4}
                                </p>
                              </div>
                              {useSavedBank && (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant={useSavedBank ? "default" : "outline"}
                                onClick={() => setUseSavedBank(true)}
                              >
                                Use this account
                              </Button>
                              <Button
                                size="sm"
                                variant={!useSavedBank ? "default" : "outline"}
                                onClick={() => setUseSavedBank(false)}
                              >
                                Use different account
                              </Button>
                            </div>
                          </div>

                          {/* Show check image upload if saved account doesn't have one */}
                          {useSavedBank && !savedBankAccount.hasCheckImage && (
                            <div>
                              <Label className="text-sm">
                                Upload a check image <span className="text-destructive">*</span>
                              </Label>
                              <p className="text-xs text-muted-foreground mb-2">
                                Required for verification (one-time only)
                              </p>
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                  checkImagePreview
                                    ? "border-success bg-success/5"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                {checkImagePreview ? (
                                  <div className="space-y-2">
                                    <img
                                      src={checkImagePreview}
                                      alt="Check preview"
                                      className="max-h-32 mx-auto rounded"
                                    />
                                    <p className="text-sm text-success">Check image uploaded</p>
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
                          )}
                        </>
                      ) : null}

                      {/* New Bank Account Form */}
                      {(!savedBankAccount || !useSavedBank) && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bank-name" className="text-sm">
                              Bank Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="bank-name"
                              type="text"
                              placeholder="Chase, Bank of America, etc."
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="account-holder" className="text-sm">
                              Account Holder Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="account-holder"
                              type="text"
                              placeholder="Business Name or Personal Name"
                              value={accountHolderName}
                              onChange={(e) => setAccountHolderName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="routing-number" className="text-sm">
                                Routing Number <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="routing-number"
                                type="text"
                                placeholder="123456789"
                                value={routingNumber}
                                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                                className="mt-1 font-mono"
                                maxLength={9}
                              />
                            </div>
                            <div>
                              <Label htmlFor="account-number" className="text-sm">
                                Account Number <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="account-number"
                                type="text"
                                placeholder="••••••••1234"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))}
                                className="mt-1 font-mono"
                                maxLength={17}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">
                              Upload a check image <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Required for verification
                            </p>
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                checkImagePreview
                                  ? "border-success bg-success/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {checkImagePreview ? (
                                <div className="space-y-2">
                                  <img
                                    src={checkImagePreview}
                                    alt="Check preview"
                                    className="max-h-32 mx-auto rounded"
                                  />
                                  <p className="text-sm text-success">Check image uploaded</p>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload a photo of a check from this account
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
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  className="w-full mt-6"
                  size="lg"
                  disabled={!canCheckout || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">
                      {isUploadingImage ? "Uploading..." : "Placing Order..."}
                    </span>
                  ) : (
                    <>
                      Submit Order - ${getTotalCost().toFixed(2)}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {!paymentMethod && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Select a payment method to continue
                  </p>
                )}

                {paymentMethod && !isPaymentInfoValid() && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Complete payment details to continue
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Mobile Sticky Footer */}
          {getCartItems().length > 0 && !paymentMethod && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getTotalItems()} GRCs</p>
                  <p className="text-lg font-semibold">${getTotalCost().toFixed(2)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getTotalItems() < MIN_ORDER_QUANTITY
                    ? `Add ${MIN_ORDER_QUANTITY - getTotalItems()} more for minimum`
                    : "Select payment method above"}
                </p>
              </div>
            </div>
          )}

          {/* Bottom padding for mobile sticky footer */}
          {getCartItems().length > 0 && !paymentMethod && <div className="h-24 lg:hidden" />}
        </>
      )}
    </DashboardLayout>
  );
}
