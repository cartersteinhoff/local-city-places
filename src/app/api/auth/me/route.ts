import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { normalizeMarketLockStatus } from "@/lib/market-lock-status";

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
            marketLockStatus: normalizeMarketLockStatus(
              session.merchant.marketLockStatus,
            ),
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
