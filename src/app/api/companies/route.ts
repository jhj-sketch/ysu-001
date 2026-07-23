import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const q = new URL(req.url).searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (session.roleCode === ROLES.STUDENT) {
    where.founderCompanies = { some: { studentId: session.studentId || "__none__" } };
  } else if (session.roleCode === ROLES.DEPT_STAFF) {
    where.founderCompanies = {
      some: { student: { departmentId: session.departmentId || "__none__" } },
    };
  }
  if (q) {
    where.OR = [
      { companyName: { contains: q } },
      { businessRegistrationNo: { contains: q } },
      { industry: { contains: q } },
    ];
  }

  if (!isCenterOrAdmin(session) && session.roleCode !== ROLES.STUDENT && session.roleCode !== ROLES.DEPT_STAFF) {
    return jsonOk([]);
  }

  const companies = await prisma.company.findMany({
    where,
    include: {
      founderCompanies: {
        include: { student: { include: { department: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return jsonOk(companies);
}
