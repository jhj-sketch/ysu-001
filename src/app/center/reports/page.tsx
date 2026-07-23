import { PageHeader, Card } from "@/components/ui";

const LINKS = [
  { type: "founders", label: "창업자 명단" },
  { type: "companies", label: "기업 명단" },
  { type: "response-rates", label: "학과 응답률" },
  { type: "participations", label: "프로그램 참여 현황" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="성과보고 다운로드" description="엑셀로 현황 자료를 내려받습니다." />
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Card key={l.type} title={l.label}>
            <a
              href={`/api/reports/export?type=${l.type}`}
              className="inline-flex rounded-md bg-teal-700 px-3 py-2 text-sm text-white"
            >
              XLSX 다운로드
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
