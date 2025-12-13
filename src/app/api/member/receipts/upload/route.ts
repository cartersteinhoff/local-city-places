import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, grcs, members, skippedReceipts } from "@/db/schema";
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
    const { image, grcId, fileName, acknowledgeWarnings, skippedReceiptId } = body as {
      image?: string;
      grcId: string;
      fileName?: string;
      acknowledgeWarnings?: boolean;
      skippedReceiptId?: string; // ID from skipped_receipts table
    };

    if (!grcId) {
      return NextResponse.json(
        { error: "Missing required field: grcId" },
        { status: 400 }
      );
    }

    // Validate GRC belongs to member and is active
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

    // FLOW A: User is confirming a skipped receipt (acknowledging warnings)
    if (acknowledgeWarnings && skippedReceiptId) {
      // Get the skipped receipt
      const [skipped] = await db
        .select()
        .from(skippedReceipts)
        .where(
          and(
            eq(skippedReceipts.id, skippedReceiptId),
            eq(skippedReceipts.memberId, member.id)
          )
        )
        .limit(1);

      if (!skipped) {
        return NextResponse.json(
          { error: "Skipped receipt not found. Please upload again." },
          { status: 400 }
        );
      }

      // Insert into receipts
      const [receipt] = await db
        .insert(receipts)
        .values({
          memberId: member.id,
          grcId: grc.id,
          imageUrl: skipped.imageUrl,
          amount: skipped.amount,
          receiptDate: skipped.receiptDate,
          extractedStoreName: skipped.extractedStoreName,
          storeMismatch: skipped.storeMismatch ?? false,
          dateMismatch: skipped.dateMismatch ?? false,
          memberOverride: true, // User acknowledged warnings
          veryfiResponse: skipped.veryfiResponse,
          status: "pending",
        })
        .returning();

      // Delete from skipped_receipts
      await db
        .delete(skippedReceipts)
        .where(eq(skippedReceipts.id, skippedReceiptId));

      return NextResponse.json({
        success: true,
        receipt: {
          id: receipt.id,
          amount: skipped.amount ? parseFloat(skipped.amount) : null,
          receiptDate: skipped.receiptDate?.toISOString() || null,
          extractedStoreName: skipped.extractedStoreName,
          storeMismatch: skipped.storeMismatch,
          dateMismatch: skipped.dateMismatch,
          status: "pending",
        },
      });
    }

    // FLOW B: Fresh upload - requires image
    if (!image) {
      return NextResponse.json(
        { error: "Missing required field: image" },
        { status: 400 }
      );
    }

    // Validate image format and size
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

    // Upload image to permanent storage
    const imageUrl = await uploadReceiptImage(
      image,
      fileName || `receipt-${Date.now()}.jpg`
    );

    // Process receipt with Veryfi OCR
    const veryfiResult = await processReceipt(image, fileName);

    // Check for duplicate - but allow if it's a retry from skipped_receipts
    if (veryfiResult.isDuplicate && veryfiResult.duplicateOf) {
      // Check if the duplicate_of document is in this member's skipped_receipts
      const [skipped] = await db
        .select()
        .from(skippedReceipts)
        .where(
          and(
            eq(skippedReceipts.veryfiDocumentId, veryfiResult.duplicateOf),
            eq(skippedReceipts.memberId, member.id)
          )
        )
        .limit(1);

      if (skipped) {
        // This is a retry! Use the cached data and return for confirmation
        const hasWarnings = skipped.storeMismatch || skipped.dateMismatch;

        if (hasWarnings) {
          // Return for confirmation (user needs to acknowledge warnings again)
          const warnings = buildWarningMessages(
            skipped.storeMismatch ?? false,
            skipped.dateMismatch ?? false,
            grc.groceryStore,
            skipped.extractedStoreName,
            skipped.receiptDate
          );

          return NextResponse.json({
            requiresConfirmation: true,
            skippedReceiptId: skipped.id, // Pass ID for confirmation
            validationResult: {
              imageUrl: skipped.imageUrl,
              amount: skipped.amount ? parseFloat(skipped.amount) : null,
              receiptDate: skipped.receiptDate?.toISOString() || null,
              extractedStoreName: skipped.extractedStoreName,
              storeMismatch: skipped.storeMismatch,
              dateMismatch: skipped.dateMismatch,
            },
            warnings,
          });
        } else {
          // No warnings - just submit directly using cached data
          const [receipt] = await db
            .insert(receipts)
            .values({
              memberId: member.id,
              grcId: grc.id,
              imageUrl: skipped.imageUrl,
              amount: skipped.amount,
              receiptDate: skipped.receiptDate,
              extractedStoreName: skipped.extractedStoreName,
              storeMismatch: false,
              dateMismatch: false,
              memberOverride: false,
              veryfiResponse: skipped.veryfiResponse,
              status: "pending",
            })
            .returning();

          // Delete from skipped_receipts
          await db
            .delete(skippedReceipts)
            .where(eq(skippedReceipts.id, skipped.id));

          return NextResponse.json({
            success: true,
            receipt: {
              id: receipt.id,
              amount: skipped.amount ? parseFloat(skipped.amount) : null,
              receiptDate: skipped.receiptDate?.toISOString() || null,
              extractedStoreName: skipped.extractedStoreName,
              storeMismatch: false,
              dateMismatch: false,
              status: "pending",
            },
          });
        }
      }

      // Not in skipped_receipts - real duplicate
      return NextResponse.json(
        {
          error: "This receipt has already been uploaded",
          duplicateOf: veryfiResult.duplicateOf,
        },
        { status: 400 }
      );
    }

    // Compare store names
    const storeMatch = compareStoreNames(
      veryfiResult.vendorName,
      grc.groceryStore || ""
    );
    const storeMismatch = !storeMatch.isMatch;

    // Check for date mismatch (receipt not in current month)
    const dateMismatch = checkDateMismatch(veryfiResult.date);

    // If there are warnings, save to skipped_receipts and return for confirmation
    const hasWarnings = storeMismatch || dateMismatch;
    if (hasWarnings) {
      const warnings = buildWarningMessages(
        storeMismatch,
        dateMismatch,
        grc.groceryStore,
        veryfiResult.vendorName,
        veryfiResult.date
      );

      // Save to skipped_receipts so user can retry or confirm later
      const [skipped] = await db
        .insert(skippedReceipts)
        .values({
          memberId: member.id,
          grcId: grc.id,
          veryfiDocumentId: veryfiResult.veryfiId,
          imageUrl,
          amount: veryfiResult.total?.toString() || null,
          receiptDate: veryfiResult.date,
          extractedStoreName: veryfiResult.vendorName,
          storeMismatch,
          dateMismatch,
          veryfiResponse: veryfiResult.rawResponse,
        })
        .returning();

      return NextResponse.json({
        requiresConfirmation: true,
        skippedReceiptId: skipped.id, // Pass ID for confirmation
        validationResult: {
          imageUrl,
          amount: veryfiResult.total,
          receiptDate: veryfiResult.date?.toISOString() || null,
          extractedStoreName: veryfiResult.vendorName,
          storeMismatch,
          dateMismatch,
        },
        warnings,
      });
    }

    // No warnings - insert directly into receipts
    const [receipt] = await db
      .insert(receipts)
      .values({
        memberId: member.id,
        grcId: grc.id,
        imageUrl,
        amount: veryfiResult.total?.toString(),
        receiptDate: veryfiResult.date,
        extractedStoreName: veryfiResult.vendorName,
        storeMismatch: false,
        dateMismatch: false,
        memberOverride: false,
        veryfiResponse: veryfiResult.rawResponse,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        amount: veryfiResult.total,
        receiptDate: veryfiResult.date?.toISOString() || null,
        extractedStoreName: veryfiResult.vendorName,
        storeMismatch: false,
        dateMismatch: false,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Receipt upload error:", error);

    // Handle specific errors
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
      if (error.message.includes("duplicate") || error.message.includes("already")) {
        return NextResponse.json(
          { error: "This receipt has already been uploaded" },
          { status: 400 }
        );
      }
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: error.message || "Failed to process receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}
