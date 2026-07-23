import Link from "next/link";
import { PageHeader, Stat, Card } from "@/components/ui";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";

export default async function DepartmentHome() {
  const session = await requirePageSession(["DEPT_STAFF", "CENTER_STAFF", "ADMIN"]);
  const departmentId = session.departmentId;

  const [founders, targets, completed] = await Promise.all([
    prisma.founderCompany.count({
      where: departmentId ? { student: { departmentId } } : undefined,
    }),
    prisma.surveyTarget.count({
      where: departmentId ? { student: { departmentId } } : undefined,
    }),
    prisma.surveyTarget.count({
      where: departmentId
        ? { student: { departmentId }, status: "COMPLETED" }
        : { status: "COMPLETED" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="학과 대시보드" description="소속 학과 조사·창업자 현황" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="등록 창업자" value={founders} />
        <Stat label="조사 대상" value={targets} />
        <Stat label="조사 완료" value={completed} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card title="졸업자 조사">
          <Link href="/department/surveys" className="text-sm text-teal-800 hover:underline">
            상태 체크하러 가기 →
          </Link>
        </Card>
        <Card title="재학생 창업자 등록">
          <Link href="/department/register" className="text-sm text-teal-800 hover:underline">
            등록하러 가기 →
          </Link>
        </Card>
      </div>
    </div>
  );
}
