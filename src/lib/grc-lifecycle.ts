import { db } from "@/db";
import { grcs, monthlyQualifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Check if a GRC has completed all its months and auto-mark it as "completed".
 * Called after a monthly qualification reaches "qualified" status.
 * Does NOT auto-activate the next GRC — member must pick a new grocery store.
 */
export async function checkAndCompleteGrc(memberId: string, grcId: string): Promise<void> {
  try {
    // Fetch the active GRC
    const [grc] = await db
      .select()
      .from(grcs)
      .where(
        and(
          eq(grcs.id, grcId),
          eq(grcs.memberId, memberId),
          eq(grcs.status, "active")
        )
      )
      .limit(1);

    if (!grc) return;

    // Count qualified months for this GRC
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(monthlyQualifications)
      .where(
        and(
          eq(monthlyQualifications.memberId, memberId),
          eq(monthlyQualifications.grcId, grcId),
          eq(monthlyQualifications.status, "qualified")
        )
      );

    const qualifiedCount = result?.count || 0;

    // If all months are qualified, mark GRC as completed
    if (qualifiedCount >= grc.monthsRemaining) {
      await db
        .update(grcs)
        .set({ status: "completed" })
        .where(eq(grcs.id, grcId));

      console.log(`GRC ${grcId} auto-completed: ${qualifiedCount}/${grc.monthsRemaining} months qualified`);
    }
  } catch (error) {
    console.error("Error in checkAndCompleteGrc:", error);
  }
}
