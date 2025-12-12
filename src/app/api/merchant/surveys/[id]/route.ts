import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, surveys, surveyResponses, merchants, members } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "multiple_choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
});

const updateSurveySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  questions: z.array(questionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get survey
    const [survey] = await db
      .select()
      .from(surveys)
      .where(and(eq(surveys.id, id), eq(surveys.merchantId, merchant.id)))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        questions: survey.questions,
        isActive: survey.isActive,
        createdAt: survey.createdAt,
      },
    });
  } catch (error) {
    console.error("Get survey error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Check survey exists and belongs to merchant
    const [existingSurvey] = await db
      .select()
      .from(surveys)
      .where(and(eq(surveys.id, id), eq(surveys.merchantId, merchant.id)))
      .limit(1);

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSurveySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Partial<typeof surveys.$inferInsert> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.questions !== undefined) updates.questions = parsed.data.questions;
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

    const [updatedSurvey] = await db
      .update(surveys)
      .set(updates)
      .where(eq(surveys.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      survey: {
        id: updatedSurvey.id,
        title: updatedSurvey.title,
        questions: updatedSurvey.questions,
        isActive: updatedSurvey.isActive,
        createdAt: updatedSurvey.createdAt,
      },
    });
  } catch (error) {
    console.error("Update survey error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Check survey exists and belongs to merchant
    const [existingSurvey] = await db
      .select()
      .from(surveys)
      .where(and(eq(surveys.id, id), eq(surveys.merchantId, merchant.id)))
      .limit(1);

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Delete survey (cascade will delete responses)
    await db.delete(surveys).where(eq(surveys.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete survey error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
