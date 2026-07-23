import { PageHeader, Card, Badge } from "@/components/ui";
import { ProgramForm } from "@/components/program-form";
import { ProgramDocUpload } from "@/components/program-doc-upload";
import { prisma } from "@/lib/prisma";

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    include: { attachments: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="프로그램 관리"
        description="교내·정부지원 프로그램 등록, 안내 문서 첨부 및 추천 규칙"
      />
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

            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-sm font-medium text-slate-800">안내 문서</div>
              <ul className="mt-2 space-y-1 text-sm">
                {p.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/files/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-800 hover:underline"
                    >
                      {a.fileName}
                    </a>
                    <span className="ml-2 text-xs text-slate-500">
                      {a.createdAt.toISOString().slice(0, 10)}
                    </span>
                  </li>
                ))}
                {!p.attachments.length && (
                  <li className="text-slate-500">첨부된 문서가 없습니다.</li>
                )}
              </ul>
              <ProgramDocUpload programId={p.id} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
