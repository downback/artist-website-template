import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseServer } from "@/lib/server"
import { cn } from "@/lib/utils"

type ActivityItem = {
  action: "add" | "update" | "delete"
  entityType: string
  context?: string
  category?: string
  date: string
  sortTime: number
}

type RecentActivityResult = {
  activities: ActivityItem[]
  hasError: boolean
}

const actionLabels: Record<ActivityItem["action"], string> = {
  add: "add",
  update: "edit",
  delete: "delete",
}

const actionBadgeClasses: Record<ActivityItem["action"], string> = {
  add: "bg-emerald-100 text-emerald-700",
  update: "bg-orange-100 text-orange-700",
  delete: "bg-red-100 text-red-700",
}

const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
})

const formatActivityDate = (timestamp: string) =>
  activityDateFormatter.format(new Date(timestamp))

const buildActivityItem = (
  action: ActivityItem["action"],
  entityType: ActivityItem["entityType"],
  timestamp: string,
  context?: ActivityItem["context"],
  category?: ActivityItem["category"],
): ActivityItem => ({
  action,
  entityType,
  context,
  category,
  date: formatActivityDate(timestamp),
  sortTime: new Date(timestamp).getTime(),
})

const isMissingTableError = (error: { code?: string } | null) =>
  error?.code === "PGRST205"

const fetchRecentActivities = async (): Promise<RecentActivityResult> => {
  try {
    const supabase = await supabaseServer()

    const { data: activityLog, error: activityLogError } = await supabase
      .from("activity_log")
      .select("action_type, entity_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    const [soloShowsResult, groupShowsResult, artworksResult, textsResult] =
      await Promise.all([
        isMissingTableError(activityLogError)
          ? supabase
              .from("bio_solo_exhibitions")
              .select("created_at")
              .order("created_at", { ascending: false })
              .limit(2)
          : Promise.resolve({ data: null, error: null }),
        isMissingTableError(activityLogError)
          ? supabase
              .from("bio_group_exhibitions")
              .select("created_at")
              .order("created_at", { ascending: false })
              .limit(2)
          : Promise.resolve({ data: null, error: null }),
        isMissingTableError(activityLogError)
          ? supabase
              .from("artworks")
              .select("created_at, category")
              .order("created_at", { ascending: false })
              .limit(4)
          : Promise.resolve({ data: null, error: null }),
        isMissingTableError(activityLogError)
          ? supabase
              .from("texts")
              .select("created_at")
              .order("created_at", { ascending: false })
              .limit(4)
          : Promise.resolve({ data: null, error: null }),
      ])

    const criticalError =
      (activityLogError && !isMissingTableError(activityLogError)
        ? activityLogError
        : null) ||
      (soloShowsResult.error && !isMissingTableError(soloShowsResult.error)
        ? soloShowsResult.error
        : null) ||
      (groupShowsResult.error && !isMissingTableError(groupShowsResult.error)
        ? groupShowsResult.error
        : null) ||
      (textsResult.error && !isMissingTableError(textsResult.error)
        ? textsResult.error
        : null) ||
      (artworksResult.error && !isMissingTableError(artworksResult.error)
        ? artworksResult.error
        : null)

    if (criticalError) {
      throw criticalError
    }

    const activities: ActivityItem[] = []

    activityLog?.forEach((item) => {
      if (!item.created_at) return
      const action = item.action_type as ActivityItem["action"]
      const entityType = item.entity_type || "Update"
      const metadata =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as {
              context?: string
              section?: string
              category?: string
            })
          : {}
      const context = metadata.context ?? metadata.section
      const category = metadata.category
      activities.push(
        buildActivityItem(
          action,
          entityType,
          item.created_at,
          context,
          category,
        ),
      )
    })

    if (isMissingTableError(activityLogError)) {
      soloShowsResult.data?.forEach((item) => {
        if (item.created_at) {
          activities.push(
            buildActivityItem(
              "add",
              "CV detail",
              item.created_at,
              "solo exhibition",
            ),
          )
        }
      })

      groupShowsResult.data?.forEach((item) => {
        if (item.created_at) {
          activities.push(
            buildActivityItem(
              "add",
              "CV detail",
              item.created_at,
              "group exhibition",
            ),
          )
        }
      })

      textsResult.data?.forEach((item) => {
        if (item.created_at) {
          activities.push(buildActivityItem("add", "Text", item.created_at))
        }
      })
    }

    artworksResult.data?.forEach((item) => {
      if (!item.created_at) return
      const entityType = item.category === "works" ? "Work" : "Exhibition"
      activities.push(buildActivityItem("add", entityType, item.created_at))
    })

    const sortedActivities = activities
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 7)

    return { activities: sortedActivities, hasError: false }
  } catch (error) {
    console.error("Failed to load recent activity", { error })
    return { activities: [], hasError: true }
  }
}

export default async function AdminRecentActivityPanel() {
  const { activities, hasError } = await fetchRecentActivities()
  const formatAreaLabel = (activity: ActivityItem) => {
    if (activity.entityType === "artwork") {
      return activity.category === "works" ? "Work" : "Exhibition"
    }
    if (activity.entityType === "cv_detail") {
      return activity.context ? `CV (${activity.context})` : "CV"
    }
    if (activity.entityType === "text") {
      return "Text"
    }
    return activity.entityType
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {hasError ? (
          <p className="text-sm text-muted-foreground">
            Unable to load activity right now.
          </p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity, index) => (
              <li
                key={`${activity.action}-${activity.entityType}-${activity.date}-${index}`}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full py-1 w-14 text-center text-[11px] uppercase tracking-wide",
                      actionBadgeClasses[activity.action],
                    )}
                  >
                    {actionLabels[activity.action]}
                  </span>
                  <span className="font-medium">
                    {formatAreaLabel(activity)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
