"use client";

import { Package } from "lucide-react";

interface InventoryItem {
  denomination: number;
  purchased: number;
  issued: number;
  available: number;
}

interface InventoryDisplayProps {
  inventory: InventoryItem[];
  isLoading?: boolean; // kept for backwards compatibility, not used
}

export function InventoryDisplay({ inventory }: InventoryDisplayProps) {
  if (inventory.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">GRC Inventory</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <p>No GRC inventory yet</p>
          <p className="text-sm mt-1">Purchase GRCs to start issuing to customers</p>
        </div>
        <a
          href="/merchant/purchase"
          className="block mt-4 text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Purchase GRCs
        </a>
      </div>
    );
  }

  const totalAvailable = inventory.reduce((sum, i) => sum + i.available, 0);
  const totalPurchased = inventory.reduce((sum, i) => sum + i.purchased, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">GRC Inventory</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalAvailable} / {totalPurchased} available
        </span>
      </div>

      <div className="space-y-4">
        {inventory.map((item) => {
          const percent = item.purchased > 0 ? (item.available / item.purchased) * 100 : 0;

          return (
            <div key={item.denomination}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">${item.denomination}</span>
                <span className="text-muted-foreground">
                  {item.available} / {item.purchased} available
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <a
        href="/merchant/purchase"
        className="block mt-6 text-center px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
      >
        Purchase More GRCs
      </a>
    </div>
  );
}
