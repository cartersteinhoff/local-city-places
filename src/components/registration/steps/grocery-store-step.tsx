"use client";

import { useState } from "react";
import { Store, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete";
import type { GroceryStore } from "@/lib/validations/member";

interface GroceryStoreStepProps {
  data: Partial<GroceryStore>;
  onNext: (data: GroceryStore) => void;
  isLoading?: boolean;
}

export function GroceryStoreStep({ data, onNext, isLoading }: GroceryStoreStepProps) {
  const [store, setStore] = useState({
    groceryStore: data.groceryStore || "",
    groceryStorePlaceId: data.groceryStorePlaceId || "",
  });
  const [error, setError] = useState("");

  const handleStoreSelect = (name: string, placeId: string) => {
    setStore({ groceryStore: name, groceryStorePlaceId: placeId });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!store.groceryStore || !store.groceryStorePlaceId) {
      setError("Please select a grocery store");
      return;
    }

    onNext(store);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Store className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Choose Your Grocery Store</h2>
        <p className="text-muted-foreground">
          Select where you&apos;ll be shopping. You&apos;ll need to submit receipts from this store.
        </p>
      </div>

      <div className="space-y-2">
        <GooglePlacesAutocomplete
          value={store.groceryStore}
          onChange={handleStoreSelect}
          placeholder="Search for a grocery store..."
          error={error}
        />
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {store.groceryStore && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Selected store:</p>
          <p className="font-medium">{store.groceryStore}</p>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> This store will be locked for the duration of your GRC.
          All receipts must be from this store to qualify for rebates.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !store.groceryStore}
      >
        Continue
      </Button>
    </form>
  );
}
