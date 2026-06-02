import { NextRequest, NextResponse } from "next/server";
import { roleHome } from "@/lib/routes";
import type { UserRole } from "@/lib/types";

const publicRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const role = (request.cookies.get("app-role")?.value ?? request.cookies.get("demo-role")?.value) as UserRole | undefined;

  if (!role && (pathname.startsWith("/app") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role === "admin" && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL(roleHome.admin, request.url));
  }

  if (role !== "admin" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(roleHome[role ?? "aluno"], request.url));
  }

  if (role === "personal" && pathname.startsWith("/app/aluno")) {
    return NextResponse.redirect(new URL(roleHome.personal, request.url));
  }

  if (role === "aluno" && pathname.startsWith("/app/personal")) {
    return NextResponse.redirect(new URL(roleHome.aluno, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/login", "/register"],
};
