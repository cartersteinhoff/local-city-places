import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, surveys, surveyResponses, merchants, members } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";

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

    // Get responses with member info
    const responses = await db
      .select({
        id: surveyResponses.id,
        memberId: surveyResponses.memberId,
        answers: surveyResponses.answers,
        month: surveyResponses.month,
        year: surveyResponses.year,
        createdAt: surveyResponses.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(surveyResponses)
      .leftJoin(members, eq(surveyResponses.memberId, members.id))
      .where(eq(surveyResponses.surveyId, id))
      .orderBy(desc(surveyResponses.createdAt));

    // Build summary for multiple choice questions
    const questions = survey.questions as {
      id: string;
      text: string;
      type: "text" | "multiple_choice";
      options?: string[];
      required: boolean;
    }[];

    const summary: Record<
      string,
      | { type: "multiple_choice"; options: Record<string, number> }
      | { type: "text"; answers: string[] }
    > = {};

    for (const question of questions) {
      if (question.type === "multiple_choice") {
        summary[question.id] = {
          type: "multiple_choice",
          options: Object.fromEntries((question.options || []).map((opt) => [opt, 0])),
        };
      } else {
        summary[question.id] = {
          type: "text",
          answers: [],
        };
      }
    }

    // Aggregate responses
    for (const response of responses) {
      const answers = response.answers as Record<string, string>;
      for (const [questionId, answer] of Object.entries(answers)) {
        const questionSummary = summary[questionId];
        if (!questionSummary) continue;

        if (questionSummary.type === "multiple_choice") {
          if (questionSummary.options[answer] !== undefined) {
            questionSummary.options[answer]++;
          }
        } else {
          if (answer && answer.trim()) {
            questionSummary.answers.push(answer);
          }
        }
      }
    }

    const formattedResponses = responses.map((r) => ({
      id: r.id,
      memberName:
        r.memberFirstName && r.memberLastName
          ? `${r.memberFirstName} ${r.memberLastName}`
          : "Unknown",
      answers: r.answers,
      month: r.month,
      year: r.year,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        questions: survey.questions,
      },
      responses: formattedResponses,
      summary,
      totalResponses: responses.length,
    });
  } catch (error) {
    console.error("Survey responses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
