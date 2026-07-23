import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent } from "@/lib/rbac";
import { jsonError, jsonOk } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      founderCompanies: { include: { student: { include: { department: true } } } },
      attachments: true,
      metrics: { orderBy: { metricYear: "desc" } },
    },
  });
  if (!company) return jsonError("기업을 찾을 수 없습니다.", 404);

  const allowed = company.founderCompanies.some((fc) => canAccessStudent(session, fc.student));
  if (!allowed) return jsonError("권한이 없습니다.", 403);

  return jsonOk(company);
}
