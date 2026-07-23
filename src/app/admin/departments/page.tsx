import { PageHeader, Table, Th, Td } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { AdminDepartmentForm } from "@/components/admin-forms";

export default async function AdminDepartmentsPage() {
  const departments = await prisma.department.findMany({ orderBy: { departmentName: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="학과 관리" />
      <AdminDepartmentForm />
      <Table>
        <thead>
          <tr>
            <Th>코드</Th>
            <Th>단과대학</Th>
            <Th>학과명</Th>
            <Th>이메일</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {departments.map((d) => (
            <tr key={d.id}>
              <Td>{d.departmentCode}</Td>
              <Td>{d.collegeName || "-"}</Td>
              <Td>{d.departmentName}</Td>
              <Td>{d.officeEmail || "-"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
