import { PageHeader, Card, Badge } from "@/components/ui";
import { requirePageSession } from "@/lib/session-page";
import { prisma } from "@/lib/prisma";
import { REVIEW_LABEL } from "@/lib/constants";

export default async function StudentCompaniesPage() {
  const session = await requirePageSession(["STUDENT", "ADMIN"]);
  const relations = session.studentId
    ? await prisma.founderCompany.findMany({
        where: { studentId: session.studentId },
        include: {
          company: { include: { attachments: { orderBy: { createdAt: "desc" } } } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader title="내 기업정보" />
      <div className="grid gap-3">
        {relations.map((r) => (
          <Card key={r.id} title={r.company.companyName}>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>사업자번호: {r.company.businessRegistrationNo || "예비창업"}</span>
              <Badge>{REVIEW_LABEL[r.verificationStatus] || r.verificationStatus}</Badge>
              <Badge tone="teal">완성도 {r.company.completenessScore}%</Badge>
            </div>
            <p className="mt-2 text-sm">{r.company.industry || "-"} · {r.company.address || "-"}</p>
            {r.company.attachments.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {r.company.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/files/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-800 hover:underline"
                    >
                      {a.category === "BUSINESS_LICENSE" ? "사업자등록증" : "증빙"}: {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {!relations.length && <Card>등록된 기업이 없습니다.</Card>}
      </div>
    </div>
  );
}
