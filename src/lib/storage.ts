import { put } from "@vercel/blob";

/**
 * Upload a receipt image to Vercel Blob storage
 * Requires BLOB_READ_WRITE_TOKEN env variable
 *
 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param fileName - Original filename
 * @returns Public URL for the stored image
 */
export async function uploadReceiptImage(
  base64Data: string,
  fileName: string = "receipt.jpg"
): Promise<string> {
  // Strip data URI prefix if present
  const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  // Convert base64 to Buffer
  const buffer = Buffer.from(rawBase64, "base64");

  // Detect content type from data URI or default to jpeg
  let contentType = "image/jpeg";
  const dataUriMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  if (dataUriMatch) {
    contentType = dataUriMatch[1];
  }

  // Generate unique path with timestamp
  const timestamp = Date.now();
  const uniqueFileName = `receipts/${timestamp}-${fileName}`;

  const blob = await put(uniqueFileName, buffer, {
    access: "public",
    contentType,
  });

  return blob.url;
}

/**
 * Get the file extension from a content type
 */
export function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[contentType] || "jpg";
}

/**
 * Validate that the base64 data is a supported image format
 */
export function validateImageFormat(base64Data: string): {
  valid: boolean;
  contentType?: string;
  error?: string;
} {
  // Check for data URI prefix
  const dataUriMatch = base64Data.match(/^data:(image\/\w+);base64,/);

  if (dataUriMatch) {
    const contentType = dataUriMatch[1];
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (supportedTypes.includes(contentType)) {
      return { valid: true, contentType };
    }
    return { valid: false, error: `Unsupported image type: ${contentType}` };
  }

  // If no data URI prefix, assume it's raw base64 JPEG
  return { valid: true, contentType: "image/jpeg" };
}

/**
 * Check if image size is within limits
 */
export function validateImageSize(
  base64Data: string,
  maxSize: number = 20 * 1024 * 1024 // 20MB default for Veryfi
): {
  valid: boolean;
  sizeBytes: number;
  error?: string;
} {
  const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  // Base64 string length * 0.75 gives approximate byte size
  const sizeBytes = Math.ceil(rawBase64.length * 0.75);

  if (sizeBytes > maxSize) {
    return {
      valid: false,
      sizeBytes,
      error: `Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
    };
  }

  return { valid: true, sizeBytes };
}

/**
 * Upload a profile photo to Vercel Blob storage
 * Returns null if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function uploadProfilePhoto(
  base64Data: string,
  fileName: string = "profile.jpg"
): Promise<string | null> {
  // Skip upload if token not configured (local dev)
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN not configured, skipping photo upload");
    return null;
  }

  const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(rawBase64, "base64");

  let contentType = "image/jpeg";
  const dataUriMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  if (dataUriMatch) {
    contentType = dataUriMatch[1];
  }

  const timestamp = Date.now();
  const uniqueFileName = `profiles/${timestamp}-${fileName}`;

  const blob = await put(uniqueFileName, buffer, {
    access: "public",
    contentType,
  });

  return blob.url;
}

/**
 * Upload a merchant logo to Vercel Blob storage
 * Returns null if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function uploadMerchantLogo(
  base64Data: string,
  fileName: string = "logo.jpg"
): Promise<string | null> {
  // Skip upload if token not configured (local dev)
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN not configured, skipping logo upload");
    return null;
  }

  const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(rawBase64, "base64");

  let contentType = "image/jpeg";
  const dataUriMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  if (dataUriMatch) {
    contentType = dataUriMatch[1];
  }

  const timestamp = Date.now();
  const uniqueFileName = `logos/${timestamp}-${fileName}`;

  const blob = await put(uniqueFileName, buffer, {
    access: "public",
    contentType,
  });

  return blob.url;
}
