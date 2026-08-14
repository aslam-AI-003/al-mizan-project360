import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME, homeForRole } from "@/lib/auth";

const ROLE_PREFIX: Record<string, "ADMIN" | "SUPERVISOR" | "CLIENT"> = {
  "/admin": "ADMIN",
  "/supervisor": "SUPERVISOR",
  "/client": "CLIENT",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const protectedPrefix = Object.keys(ROLE_PREFIX).find((prefix) => pathname.startsWith(prefix));

  if (protectedPrefix) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== ROLE_PREFIX[protectedPrefix]) {
      return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/supervisor/:path*", "/client/:path*", "/login"],
};
