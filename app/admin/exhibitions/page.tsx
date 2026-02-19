import AdminExhibitionsPanel from "@/components/admin/exhibition/ExhibitionsPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default function AdminExhibitions() {
  return (
    <div className="space-y-6">
      <AdminExhibitionsPanel />

      <Card className="border-0 bg-muted shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              전시 타이틀 텍스트는 메뉴바에 표시되는 텍스트이니, 가능한 한
              간결하게 작성해주세요.
            </li>
            <li>
              각 전시의 메인 이미지는 한 장의 이미지만 업로드할 수 있습니다.
            </li>
            <li>
              각 전시의 세부 이미지는 갯수 제한 없이 업로드 가능하나, 한 번에
              8장 이상의 고화질 사진을 업로드 할 경우 업로드 시간이 오래 걸릴 수
              있습니다.
            </li>
            <li>
              모든 이미지의 파일의 용량은 600 KB 이하를 권장합니다.(최대 1.5 MB)
            </li>
            <li>
              모든 이미지 파일의 긴 변의 길이가 3000px 이하여야 합니다.
              (웹사이트에 업로드 되는 이미지의 dpi 값은 출력 퀄리티에 영향을
              미치지 않습니다)
            </li>
            <li>
              웹사이트 전체에 들어가는 모든 이미지의 용량은 최대 50 MB 이하여야
              합니다. (각 이미지를 600 KB 이하로 업로드 한다고 하면, 총 80장
              정도의 이미지를 업로드 할 수 있습니다.)
            </li>
            <li>
              전시 타이틀 텍스트는 국문 20자 | 영문 30자 이내가 이상적이나, 이
              이상의 길이가 되는 경우에는 원하는 구간에 엔터를 추가하여 줄바꿈을
              할 수 있습니다.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
