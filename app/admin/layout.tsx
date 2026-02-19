"use client"

import { useEffect, useState, useMemo, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabaseBrowser } from "@/lib/client"
import AdminSidebar from "@/components/admin/shared/AdminSidebar"
import AdminLoginModal from "@/components/admin/dashboard/AdminLoginModal"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import Loader from "@/components/ui/Loader"

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading")

  useEffect(() => {
    let mounted = true

    const checkAdminAccess = async (session: Session | null) => {
      if (!session) {
        if (mounted) setAuthStatus("unauthorized")
        return
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("app_admin")
        .select("admin_user_id")
        .eq("singleton_id", true)
        .maybeSingle()

      if (
        adminError ||
        !adminRow ||
        adminRow.admin_user_id !== session.user.id
      ) {
        await supabase.auth.signOut()
        if (mounted) setAuthStatus("unauthorized")
        return
      }

      if (mounted) setAuthStatus("authorized")
    }

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          if (mounted) setAuthStatus("unauthorized")
          return
        }

        await checkAdminAccess(data.session)
      } catch (error) {
        console.error("Admin auth check failed", error)
        if (mounted) setAuthStatus("unauthorized")
      }
    }

    initializeAuth()

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "SIGNED_OUT") {
        setAuthStatus("unauthorized")
        return
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void checkAdminAccess(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  if (authStatus === "loading") {
    return <Loader message="Checking authentication..." />
  }

  if (authStatus !== "authorized") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <AdminLoginModal />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6 pt-22 md:pt-6 md:pl-62">
        <AdminPageHeader />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}
