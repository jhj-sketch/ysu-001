import { PageHeader, Table, Th, Td, Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/constants";
import { AdminUserForm } from "@/components/admin-forms";

export default async function AdminUsersPage() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { departmentName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="사용자 관리" />
      <AdminUserForm departments={departments} />
      <Table>
        <thead>
          <tr>
            <Th>이름</Th>
            <Th>이메일</Th>
            <Th>역할</Th>
            <Th>학과</Th>
            <Th>활성</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map((u) => (
            <tr key={u.id}>
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>
                <Badge tone="teal">{ROLE_LABEL[u.roleCode] || u.roleCode}</Badge>
              </Td>
              <Td>{u.department?.departmentName || "-"}</Td>
              <Td>{u.isActive ? "Y" : "N"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
