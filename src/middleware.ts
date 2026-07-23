import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, type SessionUser } from "@/lib/auth";
import { ROLE_HOME, type RoleCode } from "@/lib/constants";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function getSecret() {
  const secret = process.env.SESSION_SECRET || "dev-session-secret-change-in-production-32chars";
  return new TextEncoder().encode(secret);
}

async function readSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      roleCode: payload.roleCode as RoleCode,
      departmentId: (payload.departmentId as string | null) ?? null,
      studentId: (payload.studentId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const session = await readSession(req);

  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
  }

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  if (!session && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다.", data: null },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session) {
    if (pathname.startsWith("/student") && session.roleCode !== "STUDENT" && session.roleCode !== "ADMIN") {
      return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
    }
    if (
      pathname.startsWith("/department") &&
      !["DEPT_STAFF", "CENTER_STAFF", "ADMIN"].includes(session.roleCode)
    ) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
    }
    if (
      pathname.startsWith("/center") &&
      !["CENTER_STAFF", "ADMIN"].includes(session.roleCode)
    ) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
    }
    if (pathname.startsWith("/admin") && session.roleCode !== "ADMIN") {
      return NextResponse.redirect(new URL(ROLE_HOME[session.roleCode], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
