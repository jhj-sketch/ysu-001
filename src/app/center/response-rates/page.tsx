import { PageHeader, Table, Th, Td, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function ResponseRatesPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      targets: {
        include: {
          student: { include: { department: true } },
          response: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: {
    campaignTitle: string;
    departmentName: string;
    total: number;
    completed: number;
    pending: number;
    founders: number;
    rate: number;
  }[] = [];

  for (const c of campaigns) {
    const map = new Map<string, (typeof rows)[number]>();
    for (const t of c.targets) {
      const key = t.student.department.departmentName;
      if (!map.has(key)) {
        map.set(key, {
          campaignTitle: c.title,
          departmentName: key,
          total: 0,
          completed: 0,
          pending: 0,
          founders: 0,
          rate: 0,
        });
      }
      const row = map.get(key)!;
      row.total += 1;
      if (t.status === "COMPLETED") row.completed += 1;
      else row.pending += 1;
      if (t.response?.isFounder) row.founders += 1;
    }
    for (const row of map.values()) {
      row.rate = row.total ? Math.round((row.completed / row.total) * 100) : 0;
      rows.push(row);
    }
  }

  return (
    <div>
      <PageHeader
        title="학과 응답률"
        description="조사별·학과별 완료/미응답/창업자 수"
        actions={
          <a
            href="/api/reports/export?type=response-rates"
            className="rounded-md bg-teal-700 px-3 py-2 text-sm text-white"
          >
            엑셀 다운로드
          </a>
        }
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>조사</Th>
              <Th>학과</Th>
              <Th>대상</Th>
              <Th>완료</Th>
              <Th>미응답</Th>
              <Th>창업자</Th>
              <Th>응답률</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r, i) => (
              <tr key={`${r.campaignTitle}-${r.departmentName}-${i}`}>
                <Td>{r.campaignTitle}</Td>
                <Td>{r.departmentName}</Td>
                <Td>{r.total}</Td>
                <Td>{r.completed}</Td>
                <Td>{r.pending}</Td>
                <Td>{r.founders}</Td>
                <Td>{r.rate}%</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
