import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, surveys, surveyResponses, merchants } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "multiple_choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
});

const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get surveys with response counts
    const surveysRaw = await db
      .select({
        id: surveys.id,
        title: surveys.title,
        questions: surveys.questions,
        isActive: surveys.isActive,
        createdAt: surveys.createdAt,
      })
      .from(surveys)
      .where(eq(surveys.merchantId, merchant.id))
      .orderBy(desc(surveys.createdAt));

    // Get response counts for each survey
    const surveyIds = surveysRaw.map((s) => s.id);

    const responseCounts = surveyIds.length > 0
      ? await db
          .select({
            surveyId: surveyResponses.surveyId,
            count: sql<number>`count(*)::int`,
            lastResponseAt: sql<Date>`max(${surveyResponses.createdAt})`,
          })
          .from(surveyResponses)
          .where(sql`${surveyResponses.surveyId} = ANY(${surveyIds})`)
          .groupBy(surveyResponses.surveyId)
      : [];

    const responseMap = new Map(
      responseCounts.map((r) => [r.surveyId, { count: r.count, lastResponseAt: r.lastResponseAt }])
    );

    const formattedSurveys = surveysRaw.map((s) => {
      const questions = s.questions as { id: string; text: string; type: string; options?: string[]; required: boolean }[];
      const responseData = responseMap.get(s.id);

      return {
        id: s.id,
        title: s.title,
        questionCount: questions.length,
        responseCount: responseData?.count || 0,
        lastResponseAt: responseData?.lastResponseAt || null,
        isActive: s.isActive,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ surveys: formattedSurveys });
  } catch (error) {
    console.error("Surveys API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createSurveySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, questions } = parsed.data;

    // Create survey
    const [newSurvey] = await db
      .insert(surveys)
      .values({
        merchantId: merchant.id,
        title,
        questions,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      survey: {
        id: newSurvey.id,
        title: newSurvey.title,
        questionCount: questions.length,
        isActive: newSurvey.isActive,
        createdAt: newSurvey.createdAt,
      },
    });
  } catch (error) {
    console.error("Create survey error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
