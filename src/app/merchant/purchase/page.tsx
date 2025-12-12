"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  Package,
  AlertCircle,
  Lock,
  Plus,
  Trash2,
  Pencil,
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

type PaymentMethod = "zelle" | "bank_account" | null;

interface PurchaseResult {
  id: string;
  denomination: number;
  quantity: number;
  totalCost: number;
  paymentMethod: string;
}

export default function PurchaseGrcsPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();

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

  // Payment info fields
  const [zelleEmail, setZelleEmail] = useState("");
  const [zellePhone, setZellePhone] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [savePaymentInfo, setSavePaymentInfo] = useState(true);
  const [hasSavedBankAccount, setHasSavedBankAccount] = useState(false);

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
        // Pre-fill saved payment info
        if (data.savedPaymentInfo) {
          const saved = data.savedPaymentInfo;
          if (saved.preferredPaymentMethod) {
            setPaymentMethod(saved.preferredPaymentMethod as PaymentMethod);
          }
          if (saved.zelle) {
            setZelleEmail(saved.zelle.email || "");
            setZellePhone(saved.zelle.phone || "");
          }
          if (saved.bankAccount) {
            setBankAccountName(saved.bankAccount.accountHolderName || "");
            setHasSavedBankAccount(saved.bankAccount.hasAccount);
          }
        }
      })
      .catch(console.error);
  }, []);

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
      return zelleEmail.trim() !== "" || zellePhone.trim() !== "";
    }
    if (paymentMethod === "bank_account") {
      // If they have a saved bank account, only need holder name
      if (hasSavedBankAccount && bankRouting === "" && bankAccount === "") {
        return bankAccountName.trim() !== "";
      }
      return (
        bankRouting.trim() !== "" &&
        bankAccount.trim() !== "" &&
        bankAccountName.trim() !== ""
      );
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!paymentMethod || getCartItems().length === 0 || !isPaymentInfoValid()) return;

    setIsSubmitting(true);
    setError(null);

    try {
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
            paymentMethod,
            paymentInfo:
              paymentMethod === "zelle"
                ? { email: zelleEmail, phone: zellePhone }
                : {
                    routingNumber: bankRouting,
                    accountNumber: bankAccount,
                    accountName: bankAccountName,
                  },
            // Only save on first item to avoid duplicate saves
            savePaymentInfo: i === 0 ? savePaymentInfo : false,
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
    }
  };

  const canCheckout = getCartItems().length > 0 && paymentMethod !== null && isPaymentInfoValid();

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
              Your GRC purchase order has been received. We&apos;ll process your payment and add the GRCs to your inventory.
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

          {/* What Happens Next */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="font-semibold mb-4">What Happens Next</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Payment Processing</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll charge ${purchaseResults.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)} to your{" "}
                    {paymentMethod === "zelle" ? "Zelle account" : "bank account"}.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    Once payment is confirmed, your GRCs will be added to your inventory.
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
                setZelleEmail("");
                setZellePhone("");
                setBankRouting("");
                setBankAccount("");
                setBankAccountName("");
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
                  Select a denomination and quantity to add to your order
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
                  </div>
                )}
              </div>

              {/* Order Summary & Payment */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Payment Method</h3>

                <div className="space-y-3">
                  {/* Zelle Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("zelle")}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      paymentMethod === "zelle"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                        paymentMethod === "zelle" ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <CreditCard
                        className={cn(
                          "w-4 h-4",
                          paymentMethod === "zelle" ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Zelle</div>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentMethod === "zelle"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {paymentMethod === "zelle" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Zelle Form Fields */}
                  {paymentMethod === "zelle" && (
                    <div className="pl-11 space-y-3">
                      <div>
                        <Label htmlFor="zelle-email" className="text-xs">
                          Zelle Email
                        </Label>
                        <Input
                          id="zelle-email"
                          type="email"
                          placeholder="your@email.com"
                          value={zelleEmail}
                          onChange={(e) => setZelleEmail(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zelle-phone" className="text-xs">
                          Zelle Phone
                        </Label>
                        <Input
                          id="zelle-phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={zellePhone}
                          onChange={(e) => setZellePhone(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter one or both
                      </p>
                    </div>
                  )}

                  {/* Bank Transfer Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_account")}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      paymentMethod === "bank_account"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                        paymentMethod === "bank_account" ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Building2
                        className={cn(
                          "w-4 h-4",
                          paymentMethod === "bank_account" ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Bank Account</div>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentMethod === "bank_account"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {paymentMethod === "bank_account" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Bank Account Form Fields */}
                  {paymentMethod === "bank_account" && (
                    <div className="pl-11 space-y-3">
                      <div>
                        <Label htmlFor="bank-name" className="text-xs">
                          Account Holder Name
                        </Label>
                        <Input
                          id="bank-name"
                          type="text"
                          placeholder="Business or Your Name"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      {hasSavedBankAccount && bankRouting === "" && bankAccount === "" ? (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">
                            Using saved bank account
                          </p>
                          <button
                            type="button"
                            onClick={() => setHasSavedBankAccount(false)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Enter new account details
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="bank-routing" className="text-xs">
                              Routing Number
                            </Label>
                            <Input
                              id="bank-routing"
                              type="text"
                              placeholder="123456789"
                              value={bankRouting}
                              onChange={(e) => setBankRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                              className="mt-1 h-9 text-sm font-mono"
                              maxLength={9}
                            />
                          </div>
                          <div>
                            <Label htmlFor="bank-account" className="text-xs">
                              Account Number
                            </Label>
                            <Input
                              id="bank-account"
                              type="text"
                              placeholder="••••••••1234"
                              value={bankAccount}
                              onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
                              className="mt-1 h-9 text-sm font-mono"
                              maxLength={17}
                            />
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Encrypted & secure</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Payment Info Checkbox */}
                {paymentMethod && (
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                      id="save-payment"
                      checked={savePaymentInfo}
                      onCheckedChange={(checked) => setSavePaymentInfo(checked === true)}
                    />
                    <Label htmlFor="save-payment" className="text-sm cursor-pointer">
                      Save for future purchases
                    </Label>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  className="w-full mt-4"
                  disabled={!canCheckout || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Placing Order...</span>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {!paymentMethod && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Select a payment method
                  </p>
                )}

                {paymentMethod && !isPaymentInfoValid() && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Enter payment details
                  </p>
                )}

              </div>
          </div>

          {/* Mobile Sticky Footer */}
          {getCartItems().length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">{getTotalItems()} GRCs</p>
                  <p className="text-lg font-semibold">${getTotalCost().toFixed(2)}</p>
                </div>
                <Button disabled={!canCheckout || isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? "Placing..." : "Place Order"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              {!paymentMethod && (
                <p className="text-xs text-center text-muted-foreground">
                  Select a payment method above
                </p>
              )}
              {paymentMethod && !isPaymentInfoValid() && (
                <p className="text-xs text-center text-muted-foreground">
                  Enter payment details above
                </p>
              )}
            </div>
          )}

          {/* Bottom padding for mobile sticky footer */}
          {getCartItems().length > 0 && <div className="h-28 lg:hidden" />}
        </>
      )}
    </DashboardLayout>
  );
}
