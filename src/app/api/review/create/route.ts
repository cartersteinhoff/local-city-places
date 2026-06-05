import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, reviews } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { countWords, reviewCreateSchema } from "@/lib/validations/member";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = reviewCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { merchantId, content } = result.data;
    const wordCount = countWords(content);

    const [review] = await db
      .insert(reviews)
      .values({
        merchantId,
        memberId: member.id,
        content,
        wordCount,
      })
      .returning({ id: reviews.id });

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      wordCount,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
