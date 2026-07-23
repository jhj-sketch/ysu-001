import { notFound } from "next/navigation";
import { PageHeader, Card, Stat } from "@/components/ui";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export default async function CompanyDetailPage({ params }: Params) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      founderCompanies: { include: { student: { include: { department: true } } } },
      attachments: true,
    },
  });
  if (!company) notFound();

  return (
    <div>
      <PageHeader title={company.companyName} description={company.businessRegistrationNo || "예비창업"} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="완성도" value={`${company.completenessScore}%`} />
        <Stat label="매출" value={company.revenue?.toLocaleString() ?? "-"} />
        <Stat label="고용" value={company.employeeCount ?? "-"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="기본 정보">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>대표자</div>
            <div>{company.representativeName || "-"}</div>
            <div>업종</div>
            <div>{company.industry || "-"}</div>
            <div>업태</div>
            <div>{company.businessType || "-"}</div>
            <div>주소</div>
            <div>{company.address || "-"}</div>
            <div>상태</div>
            <div>{company.businessStatus}</div>
          </dl>
        </Card>
        <Card title="연계 창업자">
          <ul className="space-y-2 text-sm">
            {company.founderCompanies.map((f) => (
              <li key={f.id}>
                {f.student.name} ({f.student.studentNo}) · {f.student.department.departmentName} ·{" "}
                {f.founderRole}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
