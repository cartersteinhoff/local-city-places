/**
 * Veryfi API Client for Receipt OCR Processing
 * API Docs: https://docs.veryfi.com/api/receipts-invoices/
 */

const VERYFI_API_URL = "https://api.veryfi.com/api/v8/partner/documents";

export interface VeryfiVendor {
  name: string | null;
  raw_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone_number: string | null;
}

export interface VeryfiLineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  sku: string | null;
}

export interface VeryfiResponse {
  id: number;
  created_date: string;
  date: string | null;
  vendor: VeryfiVendor;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  currency_code: string;
  line_items: VeryfiLineItem[];
  img_url: string;
  pdf_url: string | null;
  ocr_text: string;
  is_duplicate: boolean;
  duplicate_of: number | null;
  status: string;
}

export interface ProcessedReceipt {
  veryfiId: number;
  vendorName: string | null;
  rawVendorName: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  date: Date | null;
  lineItems: VeryfiLineItem[];
  currencyCode: string;
  isDuplicate: boolean;
  duplicateOf: number | null;
  tempImageUrl: string;
  rawResponse: VeryfiResponse;
}

/**
 * Process a receipt image using Veryfi OCR
 * @param imageBase64 - Base64 encoded image data (with or without data URI prefix)
 * @param fileName - Optional filename for the image
 */
export async function processReceipt(
  imageBase64: string,
  fileName: string = "receipt.jpg"
): Promise<ProcessedReceipt> {
  const clientId = process.env.VERYFI_CLIENT_ID;
  const username = process.env.VERYFI_USERNAME;
  const apiKey = process.env.VERYFI_API_KEY;

  if (!clientId || !username || !apiKey) {
    throw new Error("Veryfi API credentials not configured");
  }

  // Strip data URI prefix if present
  const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const response = await fetch(VERYFI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Client-Id": clientId,
      Authorization: `apikey ${username}:${apiKey}`,
    },
    body: JSON.stringify({
      file_data: rawBase64,
      file_name: fileName,
    }),
  });

  if (!response.ok) {
    let errorText = "";
    let errorJson: { error?: string; message?: string; is_duplicate?: boolean } | null = null;

    try {
      errorText = await response.text();
      errorJson = JSON.parse(errorText);
    } catch {
      // Not JSON, keep as text
    }

    console.error("Veryfi API error:", response.status, errorText);

    // Check if this is a duplicate error from Veryfi
    if (errorJson?.is_duplicate ||
        errorText.toLowerCase().includes("duplicate") ||
        errorJson?.error?.toLowerCase().includes("duplicate") ||
        errorJson?.message?.toLowerCase().includes("duplicate")) {
      throw new Error("This receipt has already been uploaded (duplicate detected)");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("Veryfi authentication failed");
    }
    if (response.status === 413) {
      throw new Error("Image file too large (max 20MB)");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    throw new Error(`Veryfi API error: ${response.status}`);
  }

  const data: VeryfiResponse = await response.json();

  return {
    veryfiId: data.id,
    vendorName: data.vendor?.name ?? null,
    rawVendorName: data.vendor?.raw_name ?? null,
    total: data.total,
    subtotal: data.subtotal,
    tax: data.tax,
    date: data.date ? new Date(data.date) : null,
    lineItems: data.line_items || [],
    currencyCode: data.currency_code || "USD",
    isDuplicate: data.is_duplicate,
    duplicateOf: data.duplicate_of,
    tempImageUrl: data.img_url,
    rawResponse: data,
  };
}

/**
 * Delete a document from Veryfi by ID
 */
export async function deleteDocument(documentId: number): Promise<boolean> {
  const clientId = process.env.VERYFI_CLIENT_ID;
  const username = process.env.VERYFI_USERNAME;
  const apiKey = process.env.VERYFI_API_KEY;

  if (!clientId || !username || !apiKey) {
    console.error("Veryfi API credentials not configured");
    return false;
  }

  try {
    const response = await fetch(`${VERYFI_API_URL}/${documentId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Client-Id": clientId,
        Authorization: `apikey ${username}:${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to delete Veryfi document:", error);
    return false;
  }
}

/**
 * Get a previously processed document by ID
 */
export async function getDocument(documentId: number): Promise<VeryfiResponse> {
  const clientId = process.env.VERYFI_CLIENT_ID;
  const username = process.env.VERYFI_USERNAME;
  const apiKey = process.env.VERYFI_API_KEY;

  if (!clientId || !username || !apiKey) {
    throw new Error("Veryfi API credentials not configured");
  }

  const response = await fetch(`${VERYFI_API_URL}/${documentId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Client-Id": clientId,
      Authorization: `apikey ${username}:${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get document: ${response.status}`);
  }

  return response.json();
}
