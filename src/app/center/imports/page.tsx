import { PageHeader, Table, Th, Td, Card } from "@/components/ui";
import { ImportPanel } from "@/components/import-panel";
import { prisma } from "@/lib/prisma";

export default async function ImportsPage() {
  const jobs = await prisma.importJob.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="엑셀/CSV 가져오기"
        description="기존 조사표를 업로드해 컬럼 매핑 후 DB에 반영합니다."
      />
      <ImportPanel />
      <Card title="최근 가져오기 이력">
        <Table>
          <thead>
            <tr>
              <Th>파일</Th>
              <Th>상태</Th>
              <Th>성공/실패</Th>
              <Th>등록자</Th>
              <Th>일시</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {jobs.map((j) => (
              <tr key={j.id}>
                <Td>{j.fileName}</Td>
                <Td>{j.status}</Td>
                <Td>
                  {j.successRows}/{j.errorRows}
                </Td>
                <Td>{j.createdBy.name}</Td>
                <Td>{j.createdAt.toISOString().slice(0, 16)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
