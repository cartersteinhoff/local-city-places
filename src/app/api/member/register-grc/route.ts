import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { grcs, members, surveys, surveyResponses, reviews, monthlyQualifications, merchants, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { grcRegistrationSchema, countWords, REVIEW_BONUS_MIN_WORDS } from "@/lib/validations/member";
import { sendGrcActivatedEmail } from "@/lib/email";

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
        { error: "Member profile not found. Please complete registration first." },
        { status: 400 }
      );
    }

    const member = memberResult[0];

    // Check if member already has an active GRC
    const activeGrcResult = await db
      .select()
      .from(grcs)
      .where(
        and(
          eq(grcs.memberId, member.id),
          eq(grcs.status, "active")
        )
      )
      .limit(1);

    if (activeGrcResult.length > 0) {
      return NextResponse.json(
        { error: "You already have an active GRC. Complete it before activating another." },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = grcRegistrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      grcId,
      groceryStore,
      groceryStorePlaceId,
      surveyAnswers,
      reviewContent,
      startMonth,
      startYear,
    } = result.data;

    // Fetch GRC and verify it's claimable
    const grcResult = await db
      .select()
      .from(grcs)
      .where(eq(grcs.id, grcId))
      .limit(1);

    if (grcResult.length === 0) {
      return NextResponse.json(
        { error: "GRC not found" },
        { status: 404 }
      );
    }

    const grc = grcResult[0];

    if (grc.memberId) {
      return NextResponse.json(
        { error: "This GRC has already been claimed" },
        { status: 400 }
      );
    }

    if (grc.status !== "pending") {
      return NextResponse.json(
        { error: "This GRC is not available for claiming" },
        { status: 400 }
      );
    }

    // Calculate bonus month from review
    let bonusMonthAwarded = false;
    if (reviewContent) {
      const wordCount = countWords(reviewContent);
      bonusMonthAwarded = wordCount >= REVIEW_BONUS_MIN_WORDS;
    }

    const totalMonths = grc.monthsRemaining + (bonusMonthAwarded ? 1 : 0);

    // Start transaction
    await db.transaction(async (tx) => {
      // 1. Update GRC with member info
      await tx
        .update(grcs)
        .set({
          memberId: member.id,
          groceryStore,
          groceryStorePlaceId,
          status: "active",
          startMonth,
          startYear,
          monthsRemaining: totalMonths,
          registeredAt: new Date(),
        })
        .where(eq(grcs.id, grcId));

      // 2. Create survey response if survey answers provided
      if (surveyAnswers && Object.keys(surveyAnswers).length > 0) {
        // Find merchant's active survey
        const surveyResult = await tx
          .select()
          .from(surveys)
          .where(
            and(
              eq(surveys.merchantId, grc.merchantId),
              eq(surveys.isActive, true)
            )
          )
          .limit(1);

        if (surveyResult.length > 0) {
          await tx.insert(surveyResponses).values({
            surveyId: surveyResult[0].id,
            memberId: member.id,
            answers: surveyAnswers,
            // month/year null for registration survey
          });
        }
      }

      // 3. Create review if content provided and meets word count
      if (reviewContent && bonusMonthAwarded) {
        await tx.insert(reviews).values({
          merchantId: grc.merchantId,
          memberId: member.id,
          content: reviewContent,
          wordCount: countWords(reviewContent),
          bonusMonthAwarded: true,
        });
      }

      // 4. Create initial monthly qualification record
      await tx.insert(monthlyQualifications).values({
        memberId: member.id,
        grcId: grcId,
        month: startMonth,
        year: startYear,
        status: "in_progress",
      });
    });

    // Send welcome email (fire-and-forget)
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      const [merchant] = await db
        .select({ businessName: merchants.businessName })
        .from(merchants)
        .where(eq(merchants.id, grc.merchantId))
        .limit(1);

      if (user && merchant) {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/member`;
        sendGrcActivatedEmail({
          recipientEmail: user.email,
          recipientName: `${member.firstName}`,
          merchantName: merchant.businessName,
          denomination: grc.denomination,
          totalMonths,
          groceryStore: groceryStore,
          dashboardUrl,
        }).catch((err) => console.error("Failed to send GRC activated email:", err));
      }
    } catch (emailErr) {
      console.error("Failed to prepare GRC activated email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      grcId,
      bonusMonthAwarded,
      totalMonths,
    });
  } catch (error) {
    console.error("Error registering GRC:", error);
    return NextResponse.json(
      { error: "Failed to register GRC" },
      { status: 500 }
    );
  }
}
