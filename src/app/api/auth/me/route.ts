import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
    member: session.member
      ? {
          id: session.member.id,
          firstName: session.member.firstName,
          lastName: session.member.lastName,
        }
      : null,
    merchant: session.merchant
      ? {
          id: session.merchant.id,
          businessName: session.merchant.businessName,
        }
      : null,
  });
}
