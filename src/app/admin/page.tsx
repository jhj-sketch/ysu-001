import Link from "next/link";
import { PageHeader, Card, Stat } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
  const [users, departments, audits] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.auditLog.count(),
  ]);

  return (
    <div>
      <PageHeader title="시스템 관리" description="사용자·학과·감사 로그 관리" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="사용자" value={users} />
        <Stat label="학과" value={departments} />
        <Stat label="감사 로그" value={audits} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card title="사용자">
          <Link href="/admin/users" className="text-sm text-teal-800 hover:underline">
            관리 →
          </Link>
        </Card>
        <Card title="학과">
          <Link href="/admin/departments" className="text-sm text-teal-800 hover:underline">
            관리 →
          </Link>
        </Card>
        <Card title="감사 로그">
          <Link href="/admin/audit" className="text-sm text-teal-800 hover:underline">
            보기 →
          </Link>
        </Card>
      </div>
    </div>
  );
}
