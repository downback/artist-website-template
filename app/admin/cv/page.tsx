import AdminBioSectionPanel from "@/components/admin/bio/BioPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default function AdminBiography() {
  return (
    <div className="space-y-6">
      <div className="">
        <AdminBioSectionPanel />
      </div>
      <Card className="border-0 bg-muted shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Biography Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              모든 카테고리의 각 이력은 관리자 페이지와 같은 순서대로 포트폴리오
              웹사이트에 표시됩니다.(드래그 기능을 이용하여 순서를 변경할 수
              있습니다)
            </li>
            <li>
              각 이력의 설명 텍스트는 일관된 형식, 띄여쓰기, 길이로 업로드
              하셔야 통일된 디자인을 유지 하실 수 있습니다.
            </li>
            <li>
              각 이력의 설명 텍스트는 국문 40자 | 영문 70자 이내가 이상적이나,
              이 이상의 길이가 되는 경우에는 자동으로 줄바꿈이 됩니다.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
