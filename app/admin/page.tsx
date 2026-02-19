import AdminQuickPreviewPanel from "@/components/admin/dashboard/AdminQuickPreviewPanel"
import AdminRecentActivityPanel from "@/components/admin/dashboard/AdminRecentActivityPanel"
import { supabaseServer } from "@/lib/server"

export const dynamic = "force-dynamic"

export default async function Admin() {
  let connectionStatus = {
    status: "connected",
    message: "Connection to server successful",
  }

  try {
    const supabase = await supabaseServer()
    const { error } = await supabase
      .from("app_admin")
      .select("admin_user_id")
      .limit(1)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Supabase connection test failed", { error })
    connectionStatus = {
      status: "error",
      message:
        "There might be ongoing issue connecting to the server. Try to refresh page, or contact to administrator.",
    }
  }

  return (
    <div className="space-y-6 ">
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminRecentActivityPanel />
        <div className="lg:col-span-2">
          <AdminQuickPreviewPanel />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-md border px-4 py-3 text-sm w-full md:w-auto  text-right">
          <span
            className={
              connectionStatus.status === "connected"
                ? "text-emerald-600"
                : "text-rose-600"
            }
          >
            {connectionStatus.message}
          </span>
        </div>
      </div>
    </div>
  )
}
