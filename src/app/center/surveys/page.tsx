import { PageHeader, Card, Badge, Table, Th, Td } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { SurveyCreateForm, SurveyUpload } from "@/components/survey-admin";
import { POST_GRAD_LABEL } from "@/lib/constants";

export default async function CenterSurveysPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      targets: {
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
      <PageHeader title="졸업자 조사 관리" description="조사 회차 생성 및 졸업자 명단 업로드" />
      <SurveyCreateForm />
      {campaigns.map((c) => (
        <Card
          key={c.id}
          title={c.title}
          description={`${c.status} · 대상 ${c.targets.length}명 · 마감 ${c.dueDate?.toISOString().slice(0, 10) || "-"}`}
        >
          <div className="mb-4">
            <SurveyUpload campaignId={c.id} />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>학번</Th>
                <Th>이름</Th>
                <Th>학과</Th>
                <Th>대상상태</Th>
                <Th>응답</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {c.targets.map((t) => (
                <tr key={t.id}>
                  <Td>{t.student.studentNo}</Td>
                  <Td>{t.student.name}</Td>
                  <Td>{t.student.department.departmentName}</Td>
                  <Td>
                    <Badge>{t.status}</Badge>
                  </Td>
                  <Td>
                    {t.response
                      ? POST_GRAD_LABEL[t.response.postGraduationStatus] ||
                        t.response.postGraduationStatus
                      : "-"}
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
