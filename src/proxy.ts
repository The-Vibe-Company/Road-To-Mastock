import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const publicPaths = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/favicon.ico",
];

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
// Only re-issue the cookie when it's more than a day old, to avoid
// rewriting Set-Cookie on every single request.
const REFRESH_AFTER = 60 * 60 * 24; // 1 day

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rtm-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const response = NextResponse.next();
    response.headers.set("x-user-id", String(payload.userId));

    // Sliding session: if the token was issued more than a day ago,
    // re-sign it and reset the cookie so the user stays logged in as long
    // as they use the app at least once every 30 days.
    const iat = typeof payload.iat === "number" ? payload.iat : 0;
    const now = Math.floor(Date.now() / 1000);
    if (now - iat > REFRESH_AFTER) {
      const fresh = await new SignJWT({ userId: payload.userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);
      response.cookies.set("rtm-token", fresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        // iOS Safari (PWA standalone) ignore parfois Max-Age — on double
        // avec Expires pour forcer la persistance 30 jours.
        expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
        path: "/",
      });
    }
    return response;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
