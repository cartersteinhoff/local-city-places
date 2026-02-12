import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createReviewSchema = z.object({
  merchantId: z.string().uuid(),
  content: z.string().min(1, "Review content is required"),
  rating: z.number().int().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be a member
    if (!session.member) {
      return NextResponse.json(
        { error: "Member profile required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { merchantId, content, rating } = result.data;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const [review] = await db
      .insert(reviews)
      .values({
        merchantId,
        memberId: session.member.id,
        content,
        wordCount,
        rating,
        status: "pending",
        reviewerFirstName: session.user.firstName,
        reviewerLastName: session.user.lastName,
        reviewerPhotoUrl: session.user.profilePhotoUrl,
      })
      .returning();

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        content: review.content,
        rating: review.rating,
        reviewerFirstName: review.reviewerFirstName,
        reviewerLastName: review.reviewerLastName,
        reviewerPhotoUrl: review.reviewerPhotoUrl,
        createdAt: review.createdAt,
        photos: [],
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
