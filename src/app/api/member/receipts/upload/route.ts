import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, grcs, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { processReceipt } from "@/lib/veryfi";
import { uploadReceiptImage, validateImageFormat, validateImageSize } from "@/lib/storage";
import { compareStoreNames } from "@/lib/store-matching";

// Check if receipt date is not in current month
function checkDateMismatch(receiptDate: Date | null): boolean {
  if (!receiptDate) return false; // Can't validate without date
  const now = new Date();
  return (
    receiptDate.getMonth() !== now.getMonth() ||
    receiptDate.getFullYear() !== now.getFullYear()
  );
}

// Build warning messages for validation response
function buildWarningMessages(
  storeMismatch: boolean,
  dateMismatch: boolean,
  registeredStore: string | null,
  extractedStore: string | null,
  receiptDate: Date | null
): string[] {
  const warnings: string[] = [];

  if (storeMismatch && extractedStore) {
    warnings.push(
      `Store "${extractedStore}" doesn't match your registered store "${registeredStore}"`
    );
  }

  if (dateMismatch && receiptDate) {
    const monthName = receiptDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    warnings.push(
      `Receipt date (${monthName}) is not in the current month. Receipts should be from the current month.`
    );
  }

  return warnings;
}

// Rate limiting (in-memory for dev, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 uploads per minute

function isRateLimited(memberId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(memberId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(memberId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member profile
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 }
      );
    }

    // 2. Rate limit check
    if (isRateLimited(member.id)) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a moment." },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { image, grcId, fileName, acknowledgeWarnings } = body as {
      image: string;
      grcId: string;
      fileName?: string;
      acknowledgeWarnings?: boolean;
    };

    if (!image || !grcId) {
      return NextResponse.json(
        { error: "Missing required fields: image and grcId" },
        { status: 400 }
      );
    }

    // 4. Validate image format and size
    const formatValidation = validateImageFormat(image);
    if (!formatValidation.valid) {
      return NextResponse.json(
        { error: formatValidation.error },
        { status: 400 }
      );
    }

    const sizeValidation = validateImageSize(image);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 413 });
    }

    // 5. Validate GRC belongs to member and is active
    const [grc] = await db
      .select()
      .from(grcs)
      .where(and(eq(grcs.id, grcId), eq(grcs.memberId, member.id)))
      .limit(1);

    if (!grc) {
      return NextResponse.json(
        { error: "GRC not found or doesn't belong to you" },
        { status: 400 }
      );
    }

    if (grc.status !== "active") {
      return NextResponse.json(
        { error: "GRC is not active" },
        { status: 400 }
      );
    }

    // 6. Upload image to permanent storage
    const imageUrl = await uploadReceiptImage(
      image,
      fileName || `receipt-${Date.now()}.jpg`
    );

    // 7. Process receipt with Veryfi OCR
    const veryfiResult = await processReceipt(image, fileName);

    // 8. Check for duplicate (Veryfi handles this)
    if (veryfiResult.isDuplicate) {
      return NextResponse.json(
        {
          error: "This receipt has already been uploaded",
          duplicateOf: veryfiResult.duplicateOf,
        },
        { status: 400 }
      );
    }

    // 9. Compare store names
    const storeMatch = compareStoreNames(
      veryfiResult.vendorName,
      grc.groceryStore || ""
    );
    const storeMismatch = !storeMatch.isMatch;

    // 10. Check for date mismatch (receipt not in current month)
    const dateMismatch = checkDateMismatch(veryfiResult.date);

    // 11. If there are warnings and user hasn't acknowledged, return validation response
    const hasWarnings = storeMismatch || dateMismatch;
    if (hasWarnings && !acknowledgeWarnings) {
      const warnings = buildWarningMessages(
        storeMismatch,
        dateMismatch,
        grc.groceryStore,
        veryfiResult.vendorName,
        veryfiResult.date
      );

      return NextResponse.json({
        requiresConfirmation: true,
        validationResult: {
          amount: veryfiResult.total,
          receiptDate: veryfiResult.date?.toISOString() || null,
          extractedStoreName: veryfiResult.vendorName,
          storeMismatch,
          dateMismatch,
        },
        warnings,
        imageUrl, // Return so frontend doesn't need to re-upload
      });
    }

    // 12. Insert receipt record
    const [receipt] = await db
      .insert(receipts)
      .values({
        memberId: member.id,
        grcId: grc.id,
        imageUrl,
        amount: veryfiResult.total?.toString(),
        receiptDate: veryfiResult.date,
        extractedStoreName: veryfiResult.vendorName,
        storeMismatch,
        dateMismatch,
        memberOverride: hasWarnings, // True if warnings were acknowledged
        veryfiResponse: veryfiResult.rawResponse,
        status: "pending",
      })
      .returning();

    // 13. Return success response
    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        amount: veryfiResult.total,
        receiptDate: veryfiResult.date?.toISOString() || null,
        extractedStoreName: veryfiResult.vendorName,
        storeMismatch,
        dateMismatch,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Receipt upload error:", error);

    // Handle specific Veryfi errors
    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        return NextResponse.json(
          { error: "Receipt processing service unavailable" },
          { status: 503 }
        );
      }
      if (error.message.includes("too large")) {
        return NextResponse.json({ error: error.message }, { status: 413 });
      }
      if (error.message.includes("Rate limit")) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
    }

    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}
