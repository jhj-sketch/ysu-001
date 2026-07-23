import { PageHeader, Card } from "@/components/ui";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";
import { matchPrograms } from "@/lib/recommend";
import { StudentProgramActions } from "@/components/student-program-actions";

export default async function StudentProgramsPage() {
  const session = await requirePageSession(["STUDENT", "ADMIN"]);
  const student = session.studentId
    ? await prisma.student.findUnique({
        where: { id: session.studentId },
        include: {
          founderCompanies: { include: { company: true }, take: 1, orderBy: { updatedAt: "desc" } },
          participations: true,
        },
      })
    : null;

  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const matched = student
    ? matchPrograms(programs, student, student.founderCompanies[0]?.company)
    : [];

  return (
    <div>
      <PageHeader title="추천 프로그램" description="학적·업종·신청기간 기준 규칙 추천" />
      <div className="grid gap-3">
        {matched.map((p) => (
          <Card key={p.id} title={p.name}>
            <p className="text-sm text-slate-600">{p.description}</p>
            {p.applyUrl && (
              <a href={p.applyUrl} target="_blank" className="mt-2 inline-block text-sm text-teal-800">
                신청 페이지 열기
              </a>
            )}
            {session.studentId && (
              <StudentProgramActions programId={p.id} studentId={session.studentId} />
            )}
          </Card>
        ))}
        {!matched.length && <Card>현재 매칭되는 프로그램이 없습니다.</Card>}
      </div>
    </div>
  );
}
