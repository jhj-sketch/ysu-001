import Link from "next/link";
import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { REVIEW_LABEL } from "@/lib/constants";

export default async function CenterDashboard() {
  const [founderCount, companyCount, approved, pending, openCampaigns, programs] =
    await Promise.all([
      prisma.founderCompany.count(),
      prisma.company.count(),
      prisma.founderCompany.count({ where: { officialStatIncluded: true } }),
      prisma.founderCompany.count({
        where: { verificationStatus: { in: ["SUBMITTED", "REVIEWING", "PENDING"] } },
      }),
      prisma.campaign.count({ where: { status: "OPEN" } }),
      prisma.program.count({ where: { isActive: true } }),
    ]);

  const recent = await prisma.founderCompany.findMany({
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: { student: { include: { department: true } }, company: true },
  });

  return (
    <div>
      <PageHeader
        title="센터 대시보드"
        description="전체 창업자·기업·조사·프로그램 현황을 한눈에 봅니다."
        actions={
          <Link
            href="/center/register"
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white"
          >
            창업자 등록
          </Link>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="창업 관계" value={founderCount} />
        <Stat label="기업" value={companyCount} />
        <Stat label="공식 통계 포함" value={approved} />
        <Stat label="검토 대기" value={pending} />
        <Stat label="진행중 조사" value={openCampaigns} />
        <Stat label="활성 프로그램" value={programs} />
      </div>

      <Card title="최근 등록/갱신">
        <div className="space-y-2">
          {recent.map((f) => (
            <Link
              key={f.id}
              href={`/center/founders/${f.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
            >
              <div>
                <div className="font-medium text-slate-900">
                  {f.student.name} · {f.company.companyName}
                </div>
                <div className="text-xs text-slate-500">
                  {f.student.department.departmentName} · {f.student.studentNo}
                </div>
              </div>
              <Badge tone={f.officialStatIncluded ? "green" : "amber"}>
                {REVIEW_LABEL[f.verificationStatus] || f.verificationStatus}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
