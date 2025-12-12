import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

// Only allow POST for logout to prevent prefetch/CSRF issues
export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}
