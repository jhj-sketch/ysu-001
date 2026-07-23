import { PageHeader, Card, Table, Th, Td, Badge } from "@/components/ui";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";
import { SurveyResponseForm } from "@/components/survey-admin";
import { POST_GRAD_LABEL } from "@/lib/constants";

export default async function DepartmentSurveysPage() {
  const session = await requirePageSession(["DEPT_STAFF", "CENTER_STAFF", "ADMIN"]);

  const campaigns = await prisma.campaign.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    include: {
      targets: {
        where:
          session.roleCode === "DEPT_STAFF" && session.departmentId
            ? { student: { departmentId: session.departmentId } }
            : undefined,
        include: {
          student: { include: { department: true } },
          response: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="졸업자 조사" description="취업/진학/창업/미상 상태를 체크합니다. 창업 선택 시 기업 등록으로 이동합니다." />
      {campaigns.map((c) => (
        <Card key={c.id} title={c.title} description={`대상 ${c.targets.length}명`}>
          <Table>
            <thead>
              <tr>
                <Th>학번</Th>
                <Th>이름</Th>
                <Th>현재 응답</Th>
                <Th>상태 입력</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {c.targets.map((t) => (
                <tr key={t.id}>
                  <Td>{t.student.studentNo}</Td>
                  <Td>{t.student.name}</Td>
                  <Td>
                    {t.response ? (
                      <Badge tone={t.response.isFounder ? "teal" : "slate"}>
                        {POST_GRAD_LABEL[t.response.postGraduationStatus]}
                      </Badge>
                    ) : (
                      <Badge>미응답</Badge>
                    )}
                  </Td>
                  <Td>
                    <SurveyResponseForm targetId={t.id} studentNo={t.student.studentNo} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
