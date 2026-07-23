import Link from "next/link";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: { founderCompanies: { include: { student: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="기업 목록" description="사업자번호 기준 기업 마스터" />
      <Table>
        <thead>
          <tr>
            <Th>기업명</Th>
            <Th>사업자번호</Th>
            <Th>업종</Th>
            <Th>완성도</Th>
            <Th>창업자</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {companies.map((c) => (
            <tr key={c.id}>
              <Td>
                <Link href={`/center/companies/${c.id}`} className="font-medium text-teal-800 hover:underline">
                  {c.companyName}
                </Link>
              </Td>
              <Td>{c.businessRegistrationNo || "예비창업"}</Td>
              <Td>{c.industry || "-"}</Td>
              <Td>{c.completenessScore}%</Td>
              <Td>{c.founderCompanies.map((f) => f.student.name).join(", ")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
