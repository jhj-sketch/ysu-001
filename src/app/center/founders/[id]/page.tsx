import { notFound } from "next/navigation";
import { PageHeader, Card, Badge, Stat } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { REVIEW_LABEL, STUDENT_STATUS_LABEL } from "@/lib/constants";
import { ReviewActions } from "@/components/review-actions";
import { FounderCrmPanel } from "@/components/founder-crm-panel";
import { matchPrograms } from "@/lib/recommend";

type Params = { params: Promise<{ id: string }> };

export default async function FounderDetailPage({ params }: Params) {
  const { id } = await params;
  const founder = await prisma.founderCompany.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          department: true,
          recommendations: { include: { program: true }, orderBy: { guidedAt: "desc" } },
          participations: { include: { program: true }, orderBy: { updatedAt: "desc" } },
          consultationNotes: {
            include: { author: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      company: { include: { attachments: { orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!founder) notFound();

  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const suggested = matchPrograms(programs, founder.student, founder.company);

  return (
    <div>
      <PageHeader
        title={`${founder.student.name} · ${founder.company.companyName}`}
        description={`${founder.student.department.departmentName} / ${founder.student.studentNo}`}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="학적" value={STUDENT_STATUS_LABEL[founder.student.studentStatus] || "-"} />
        <Stat label="검토" value={REVIEW_LABEL[founder.verificationStatus] || "-"} />
        <Stat label="완성도" value={`${founder.company.completenessScore}%`} />
        <Stat label="공식통계" value={founder.officialStatIncluded ? "포함" : "미포함"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="기업 정보">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>사업자번호</div>
            <div>{founder.company.businessRegistrationNo || "예비창업"}</div>
            <div>대표자</div>
            <div>{founder.company.representativeName || "-"}</div>
            <div>업종</div>
            <div>{founder.company.industry || "-"}</div>
            <div>업태</div>
            <div>{founder.company.businessType || "-"}</div>
            <div>주소</div>
            <div>{founder.company.address || "-"}</div>
            <div>매출</div>
            <div>{founder.company.revenue?.toLocaleString() ?? "-"}</div>
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 text-sm font-medium text-slate-800">사업자등록증 / 증빙</div>
            <ul className="space-y-1 text-sm">
              {founder.company.attachments.map((a) => (
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
                    {a.category} · {a.createdAt.toISOString().slice(0, 10)}
                  </span>
                </li>
              ))}
              {!founder.company.attachments.length && (
                <li className="text-slate-500">첨부 파일 없음</li>
              )}
            </ul>
          </div>
        </Card>

        <Card title="센터 검토">
          <ReviewActions founderId={founder.id} />
        </Card>

        <Card title="추천 가능 프로그램">
          <ul className="space-y-2 text-sm">
            {suggested.map((p) => (
              <li key={p.id} className="rounded-md border border-slate-100 px-3 py-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-slate-500">{p.description}</div>
              </li>
            ))}
            {!suggested.length && <li className="text-slate-500">매칭 프로그램 없음</li>}
          </ul>
        </Card>

        <Card title="지원 연계 / 메모">
          <FounderCrmPanel studentId={founder.studentId} programs={programs} />
        </Card>

        <Card title="안내·참여 이력" className="lg:col-span-2">
          <div className="space-y-2 text-sm">
            {founder.student.recommendations.map((r) => (
              <div key={r.id} className="flex justify-between border-b border-slate-50 py-2">
                <span>안내: {r.program.name}</span>
                <Badge tone="teal">{r.guidedAt.toISOString().slice(0, 10)}</Badge>
              </div>
            ))}
            {founder.student.participations.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-slate-50 py-2">
                <span>
                  참여: {p.program.name} ({p.applicationStatus}/{p.participationStatus})
                </span>
              </div>
            ))}
            {founder.student.consultationNotes.map((n) => (
              <div key={n.id} className="rounded-md bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-500">
                  {n.author.name} · {n.createdAt.toISOString().slice(0, 16)}
                </div>
                <div>{n.content}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
