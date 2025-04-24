import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect") || "/"

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Try to exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
    } else if (data?.user) {
      // Check if a profile exists for this user
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError && profileError.code === "PGRST116") {
        // No rows returned
        // Create a profile for this user
        const username =
          data.user.user_metadata?.username ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "user_" + Math.random().toString(36).substring(2, 10)

        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username,
            email: data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url || "",
          },
        ])
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
}
