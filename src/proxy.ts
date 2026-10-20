import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/invite"];

/** Pagine dell'app senza cookie di sessione → login; `x-pathname` serve ad apiServer per il `next` dopo un 401. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const current = pathname + search;
  if (!PUBLIC.includes(pathname) && !request.cookies.has("cinofili_token")) {
    return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(current), request.url));
  }
  const headers = new Headers(request.headers);
  headers.set("x-pathname", current);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // asset, file statici e /api (rewrite verso il backend) esclusi
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
