import Link from "next/link";
import { PageHeader, Card, Stat } from "@/components/ui";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";

export default async function StudentHome() {
  const session = await requirePageSession(["STUDENT", "ADMIN"]);
  const studentId = session.studentId;

  const relations = studentId
    ? await prisma.founderCompany.findMany({
        where: { studentId },
        include: { company: true },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={`안녕하세요, ${session.name}님`}
        description="내 창업정보를 등록하고 추천 프로그램을 확인하세요."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="등록 기업" value={relations.length} />
        <Stat
          label="승인 완료"
          value={relations.filter((r) => r.officialStatIncluded).length}
        />
        <Stat
          label="평균 완성도"
          value={
            relations.length
              ? Math.round(
                  relations.reduce((s, r) => s + r.company.completenessScore, 0) /
                    relations.length,
                )
              : 0
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card title="창업정보 등록">
          <Link href="/student/register" className="text-sm text-teal-800 hover:underline">
            등록하러 가기 →
          </Link>
        </Card>
        <Card title="내 기업">
          <Link href="/student/companies" className="text-sm text-teal-800 hover:underline">
            기업 보기 →
          </Link>
        </Card>
        <Card title="추천 프로그램">
          <Link href="/student/programs" className="text-sm text-teal-800 hover:underline">
            프로그램 보기 →
          </Link>
        </Card>
      </div>
    </div>
  );
}
