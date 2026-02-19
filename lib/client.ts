import { createBrowserClient } from "@supabase/ssr"

// Runtime boundary: use this helper only in Client Components.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
