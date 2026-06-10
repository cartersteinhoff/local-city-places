import { and, desc, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, merchantInvites } from "@/db";
import { getSession } from "@/lib/auth";
import { getMerchantTrialProgress } from "@/lib/merchant-trial";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  let marketLockStatus: "trial" | "pro" = "pro";

  if (session.merchant) {
    const [merchantTrialInvite] = await db
      .select({
        usedAt: merchantInvites.usedAt,
      })
      .from(merchantInvites)
      .where(
        and(
          eq(merchantInvites.usedByUserId, session.user.id),
          isNotNull(merchantInvites.usedAt),
        ),
      )
      .orderBy(desc(merchantInvites.usedAt))
      .limit(1);
    const trialStartedAt =
      merchantTrialInvite?.usedAt ||
      (session.user.role === "admin" ? session.merchant.updatedAt : null);

    marketLockStatus = getMerchantTrialProgress(trialStartedAt)
      ? "trial"
      : "pro";
  }

  return NextResponse.json(
    {
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        profilePhotoUrl: session.user.profilePhotoUrl,
      },
      member: session.member
        ? {
            id: session.member.id,
          }
        : null,
      merchant: session.merchant
        ? {
            id: session.merchant.id,
            businessName: session.merchant.businessName,
            marketLockStatus,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
