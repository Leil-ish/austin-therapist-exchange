import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { bootstrapProfileForUser } from "@/lib/auth/bootstrap";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

// Minimal OAuth/email auth callback handler for Supabase App Router flows.
// Uses getAll/setAll so session cookies are applied directly to the redirect response.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/member");

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (data.user) {
      await bootstrapProfileForUser(data.user);
    }

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  } else if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      await bootstrapProfileForUser(data.user);
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing-auth-token", url.origin));
  }

  return response;
}
