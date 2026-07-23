import { PageHeader, Card, Badge } from "@/components/ui";
import { ProgramForm } from "@/components/program-form";
import { prisma } from "@/lib/prisma";

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="프로그램 관리" description="교내·정부지원 프로그램 등록 및 추천 규칙" />
      <ProgramForm />
      <div className="grid gap-3">
        {programs.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  대상: {p.targetStatuses} · 키워드: {p.industryKeywords || "-"}
                </p>
              </div>
              <Badge tone={p.isActive ? "green" : "slate"}>
                {p.isActive ? "활성" : "비활성"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
