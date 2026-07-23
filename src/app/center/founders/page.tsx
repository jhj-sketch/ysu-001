import Link from "next/link";
import { PageHeader, Table, Th, Td, Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { REVIEW_LABEL, STUDENT_STATUS_LABEL } from "@/lib/constants";

export default async function FoundersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reviewStatus?: string }>;
}) {
  const sp = await searchParams;
  const founders = await prisma.founderCompany.findMany({
    where: {
      verificationStatus: sp.reviewStatus || undefined,
      OR: sp.q
        ? [
            { student: { name: { contains: sp.q } } },
            { student: { studentNo: { contains: sp.q } } },
            { company: { companyName: { contains: sp.q } } },
          ]
        : undefined,
    },
    include: { student: { include: { department: true } }, company: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="창업자 목록" description="검색·필터 후 상세에서 승인/반려를 처리합니다." />
      <Card className="mb-4">
        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="학번/이름/기업명"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="reviewStatus"
            defaultValue={sp.reviewStatus || ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">전체 상태</option>
            <option value="SUBMITTED">제출</option>
            <option value="REVIEWING">확인중</option>
            <option value="APPROVED">승인</option>
            <option value="REJECTED">반려</option>
            <option value="NEEDS_MORE_INFO">보완요청</option>
          </select>
          <button className="rounded-md bg-teal-700 px-3 py-2 text-sm text-white">검색</button>
        </form>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>학생</Th>
            <Th>학과</Th>
            <Th>학적</Th>
            <Th>기업</Th>
            <Th>완성도</Th>
            <Th>상태</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {founders.map((f) => (
            <tr key={f.id}>
              <Td>
                <Link className="font-medium text-teal-800 hover:underline" href={`/center/founders/${f.id}`}>
                  {f.student.name}
                </Link>
                <div className="text-xs text-slate-500">{f.student.studentNo}</div>
              </Td>
              <Td>{f.student.department.departmentName}</Td>
              <Td>{STUDENT_STATUS_LABEL[f.student.studentStatus]}</Td>
              <Td>
                {f.company.companyName}
                <div className="text-xs text-slate-500">{f.company.businessRegistrationNo || "예비창업"}</div>
              </Td>
              <Td>{f.company.completenessScore}%</Td>
              <Td>
                <Badge tone={f.officialStatIncluded ? "green" : "amber"}>
                  {REVIEW_LABEL[f.verificationStatus] || f.verificationStatus}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
