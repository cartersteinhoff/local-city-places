import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/member", "/merchant", "/admin"];
const DEV_ADMIN_EMAIL =
  process.env.DEV_AUTO_LOGIN_EMAIL || "cartersteinhoff@gmail.com";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session_token")?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !sessionToken) {
    if (process.env.NODE_ENV === "development") {
      const url = new URL("/api/auth/dev-login", request.url);
      url.searchParams.set("email", DEV_ADMIN_EMAIL);
      url.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }

    // Redirect to home page with return URL
    const url = new URL("/", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Note: Role-based access control is handled at the page/API level
  // since we can't easily decrypt the session token in middleware
  // without making a database call

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/merchant/:path*", "/admin/:path*"],
};
