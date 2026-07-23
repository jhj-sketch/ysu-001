import { PageHeader } from "@/components/ui";
import { FounderRegisterForm } from "@/components/founder-register-form";
import { requirePageSession } from "@/lib/session-page";

export default async function DepartmentRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ studentNo?: string; studentStatus?: string }>;
}) {
  const session = await requirePageSession(["DEPT_STAFF", "CENTER_STAFF", "ADMIN"]);
  const sp = await searchParams;

  return (
    <div>
      <PageHeader title="학과 창업자 등록" description="소속 학과 학생·졸업생 창업정보를 입력합니다." />
      <FounderRegisterForm
        defaults={{
          studentNo: sp.studentNo,
          departmentId: session.departmentId || undefined,
          studentStatus: sp.studentStatus || "ENROLLED",
        }}
      />
    </div>
  );
}
