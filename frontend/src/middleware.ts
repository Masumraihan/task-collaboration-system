import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/verify-account",
  "/forget-password",
  "/reset-password",
];

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/members": ["ADMIN", "PROJECT_MANAGER"],
  "/dashboard/projects": ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  "/dashboard/tasks": ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Not authenticated — redirect to login
  if (!accessToken && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already authenticated — redirect away from auth pages
  if (accessToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Role-based route protection
  if (accessToken && userRole) {
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
