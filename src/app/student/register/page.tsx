import { PageHeader } from "@/components/ui";
import { FounderRegisterForm } from "@/components/founder-register-form";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";

export default async function StudentRegisterPage() {
  const session = await requirePageSession(["STUDENT", "ADMIN"]);
  const student = session.studentId
    ? await prisma.student.findUnique({ where: { id: session.studentId } })
    : null;

  return (
    <div>
      <PageHeader title="내 창업정보 등록" description="본인 학번으로 창업기업을 등록합니다." />
      <FounderRegisterForm
        lockStudentNo
        defaults={{
          studentNo: student?.studentNo || session.email,
          name: student?.name || session.name,
          departmentId: student?.departmentId || session.departmentId || undefined,
          studentStatus: student?.studentStatus || "ENROLLED",
          email: student?.email || session.email,
          phone: student?.phone || undefined,
        }}
      />
    </div>
  );
}
