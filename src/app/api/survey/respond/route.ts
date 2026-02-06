import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { surveys, surveyResponses, members, monthlyQualifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { surveyResponseSchema } from "@/lib/validations/member";
import { checkAndCompleteGrc } from "@/lib/grc-lifecycle";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get member profile
    const memberResult = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (memberResult.length === 0) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 }
      );
    }

    const member = memberResult[0];

    // Parse and validate request body
    const body = await request.json();
    const result = surveyResponseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { surveyId, grcId, answers, isRegistration, month, year } = result.data;

    // Verify survey exists
    const surveyResult = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, surveyId))
      .limit(1);

    if (surveyResult.length === 0) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // For non-registration surveys, check if already responded this month
    if (!isRegistration && month && year) {
      const existingResponse = await db
        .select()
        .from(surveyResponses)
        .where(
          and(
            eq(surveyResponses.surveyId, surveyId),
            eq(surveyResponses.memberId, member.id),
            eq(surveyResponses.month, month),
            eq(surveyResponses.year, year)
          )
        )
        .limit(1);

      if (existingResponse.length > 0) {
        return NextResponse.json(
          { error: "You have already responded to this survey this month" },
          { status: 400 }
        );
      }
    }

    // Create survey response
    const [response] = await db
      .insert(surveyResponses)
      .values({
        surveyId,
        memberId: member.id,
        month: isRegistration ? null : month,
        year: isRegistration ? null : year,
        answers,
      })
      .returning({ id: surveyResponses.id });

    // If this is a monthly survey, update the qualification record
    if (!isRegistration && month && year) {
      // Fetch current qualification to check receipts status
      const [qual] = await db
        .select()
        .from(monthlyQualifications)
        .where(
          and(
            eq(monthlyQualifications.memberId, member.id),
            eq(monthlyQualifications.grcId, grcId),
            eq(monthlyQualifications.month, month),
            eq(monthlyQualifications.year, year)
          )
        )
        .limit(1);

      if (qual) {
        const approvedTotal = parseFloat(qual.approvedTotal || "0");
        const receiptsComplete = approvedTotal >= 100;

        // Determine new status: if receipts already >= $100, auto-qualify
        let newStatus = qual.status;
        if (receiptsComplete && (qual.status === "in_progress" || qual.status === "receipts_complete")) {
          newStatus = "qualified";
        }

        await db
          .update(monthlyQualifications)
          .set({
            surveyCompletedAt: new Date(),
            status: newStatus,
          })
          .where(eq(monthlyQualifications.id, qual.id));

        // If just qualified, check if GRC is fully complete
        if (newStatus === "qualified") {
          await checkAndCompleteGrc(member.id, grcId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      responseId: response.id,
    });
  } catch (error) {
    console.error("Error submitting survey response:", error);
    return NextResponse.json(
      { error: "Failed to submit survey response" },
      { status: 500 }
    );
  }
}
