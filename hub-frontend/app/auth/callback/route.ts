import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// The OAuth PKCE code must be exchanged before navigating to the dashboard.
// This route writes session cookies into the redirect response.
export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", reason);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return redirectToLogin(request, "oauth");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return redirectToLogin(request, "configuration");
  }

  // Never redirect to an untrusted URL received through a query parameter.
  // The dashboard is the only post-authentication destination for this flow.
  const destination = new URL("/dashboard", request.url);
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectToLogin(request, "oauth");
    return response;
  } catch {
    return redirectToLogin(request, "oauth");
  }
}
