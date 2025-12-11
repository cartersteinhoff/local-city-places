export interface StoreMatchResult {
  isMatch: boolean;
  extractedName: string | null;
  registeredName: string;
}

/**
 * Compare Veryfi's extracted vendor name against member's registered grocery store
 * Uses simple normalized comparison since Veryfi already normalizes vendor names
 */
export function compareStoreNames(
  extractedName: string | null,
  registeredStore: string
): StoreMatchResult {
  if (!extractedName) {
    return {
      isMatch: false,
      extractedName,
      registeredName: registeredStore,
    };
  }

  const normalized1 = normalizeStoreName(extractedName);
  const normalized2 = normalizeStoreName(registeredStore);

  // Check exact match or if one contains the other
  const isMatch =
    normalized1 === normalized2 ||
    normalized1.includes(normalized2) ||
    normalized2.includes(normalized1);

  return {
    isMatch,
    extractedName,
    registeredName: registeredStore,
  };
}

/**
 * Basic normalization for comparison
 */
function normalizeStoreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/#\d+/g, "") // Remove store numbers
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ")
    .trim();
}
