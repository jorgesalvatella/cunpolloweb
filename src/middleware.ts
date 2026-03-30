import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["cunpollo.com", "www.cunpollo.com", "cunpolloweb.vercel.app"];

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] || "";

  // Redirect unknown subdomains to main domain
  if (host && !ALLOWED_HOSTS.includes(host) && !host.includes("localhost")) {
    return NextResponse.redirect("https://cunpollo.com", 301);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
