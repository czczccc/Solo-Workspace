import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/api/health", "/offline.html", "/manifest.webmanifest", "/sw.js"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  let session;
  try {
    session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error(err);
    return new NextResponse("Server misconfigured: SESSION_SECRET is missing or too short.", { status: 500 });
  }
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons/|favicon|icon|apple-icon|robots.txt).*)"],
};
