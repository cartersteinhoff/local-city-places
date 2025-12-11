import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, members, grcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { reviewCreateSchema, countWords, REVIEW_BONUS_MIN_WORDS } from "@/lib/validations/member";

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
    const result = reviewCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { merchantId, grcId, content } = result.data;

    // Calculate word count and bonus eligibility
    const wordCount = countWords(content);
    const bonusMonthAwarded = wordCount >= REVIEW_BONUS_MIN_WORDS;

    // Create review
    const [review] = await db
      .insert(reviews)
      .values({
        merchantId,
        memberId: member.id,
        content,
        wordCount,
        bonusMonthAwarded,
      })
      .returning({ id: reviews.id });

    // If bonus awarded, update GRC months remaining
    if (bonusMonthAwarded) {
      const grcResult = await db
        .select()
        .from(grcs)
        .where(eq(grcs.id, grcId))
        .limit(1);

      if (grcResult.length > 0) {
        const grc = grcResult[0];
        await db
          .update(grcs)
          .set({
            monthsRemaining: grc.monthsRemaining + 1,
          })
          .where(eq(grcs.id, grcId));
      }
    }

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      wordCount,
      bonusMonthAwarded,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
