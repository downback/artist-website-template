import WorksPanel from "@/components/admin/works/WorksPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminWorks() {
  return (
    <div className="space-y-6">
      <WorksPanel />

      <Card className="border-0 bg-muted shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Works Upload Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              새로운 연도를 추가 후, 아무 작업을 업로드하지 않으실 경우에는 해당
              연도가 자동으로 삭제됩니다.
            </li>
            <li>개별 작업에 하나의 이미지만 업로드할 수 있습니다.</li>
            <li>
              모든 이미지의 파일의 용량은 1 MB 이하여야합니다.(최대 1.5 MB)
            </li>
            <li>
              모든 이미지 파일의 긴 변의 길이가 3000px 이하여야 합니다.
              (웹사이트에 업로드 되는 이미지의 dpi 값은 출력 퀄리티에 영향을
              미치지 않습니다)
            </li>
            <li>
              타이틀 및 캡션 텍스트는 국문 20자 | 영문 30자 이내가 이상적이나,
              이 이상의 길이가 되는 경우에는 원하는 구간에 엔터를 추가하여
              줄바꿈을 할 수 있습니다.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
