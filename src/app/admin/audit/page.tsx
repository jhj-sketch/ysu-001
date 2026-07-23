import { PageHeader, Table, Th, Td } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="감사 로그" description="로그인, 승인, 다운로드, 업로드 등 주요 행위" />
      <Table>
        <thead>
          <tr>
            <Th>일시</Th>
            <Th>사용자</Th>
            <Th>액션</Th>
            <Th>대상</Th>
            <Th>상세</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {logs.map((l) => (
            <tr key={l.id}>
              <Td>{l.createdAt.toISOString().slice(0, 19)}</Td>
              <Td>{l.user?.name || "-"}</Td>
              <Td>{l.action}</Td>
              <Td>
                {l.entityType || "-"} {l.entityId ? `(${l.entityId.slice(0, 8)})` : ""}
              </Td>
              <Td className="max-w-xs truncate">{l.detail || "-"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
