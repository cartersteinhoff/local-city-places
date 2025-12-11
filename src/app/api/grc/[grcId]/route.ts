import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { grcs, merchants, surveys } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grcId: string }> }
) {
  try {
    const { grcId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(grcId)) {
      return NextResponse.json(
        { error: "Invalid GRC ID format" },
        { status: 400 }
      );
    }

    // Fetch GRC with merchant info
    const grcResult = await db
      .select({
        id: grcs.id,
        merchantId: grcs.merchantId,
        memberId: grcs.memberId,
        denomination: grcs.denomination,
        status: grcs.status,
        monthsRemaining: grcs.monthsRemaining,
        groceryStore: grcs.groceryStore,
        startMonth: grcs.startMonth,
        startYear: grcs.startYear,
        issuedAt: grcs.issuedAt,
        registeredAt: grcs.registeredAt,
        merchantName: merchants.businessName,
      })
      .from(grcs)
      .leftJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(eq(grcs.id, grcId))
      .limit(1);

    if (grcResult.length === 0) {
      return NextResponse.json(
        { error: "GRC not found" },
        { status: 404 }
      );
    }

    const grc = grcResult[0];

    // Check if GRC is already claimed
    if (grc.memberId) {
      return NextResponse.json(
        { error: "This GRC has already been claimed" },
        { status: 400 }
      );
    }

    // Check if GRC is expired
    if (grc.status === "expired") {
      return NextResponse.json(
        { error: "This GRC has expired" },
        { status: 410 }
      );
    }

    // Check if GRC status is valid for claiming (should be pending)
    if (grc.status !== "pending") {
      return NextResponse.json(
        { error: "This GRC is not available for claiming" },
        { status: 400 }
      );
    }

    // Fetch merchant's active survey (if any)
    const surveyResult = await db
      .select({
        id: surveys.id,
        title: surveys.title,
        questions: surveys.questions,
      })
      .from(surveys)
      .where(
        and(
          eq(surveys.merchantId, grc.merchantId),
          eq(surveys.isActive, true)
        )
      )
      .limit(1);

    const survey = surveyResult.length > 0 ? surveyResult[0] : null;

    return NextResponse.json({
      id: grc.id,
      merchantId: grc.merchantId,
      merchantName: grc.merchantName,
      denomination: grc.denomination,
      status: grc.status,
      monthsRemaining: grc.monthsRemaining,
      survey: survey
        ? {
            id: survey.id,
            title: survey.title,
            questions: survey.questions as Array<{
              id: string;
              type: "text" | "multiple_choice" | "single_choice";
              question: string;
              options?: string[];
              required?: boolean;
            }>,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching GRC:", error);
    return NextResponse.json(
      { error: "Failed to fetch GRC details" },
      { status: 500 }
    );
  }
}
