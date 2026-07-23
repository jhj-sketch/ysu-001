import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { registerFounder, type RegisterFounderInput } from "@/lib/register-founder";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const departmentId = searchParams.get("departmentId") || undefined;
  const reviewStatus = searchParams.get("reviewStatus") || undefined;
  const studentStatus = searchParams.get("studentStatus") || undefined;

  const where: Record<string, unknown> = {};

  if (session.roleCode === ROLES.STUDENT) {
    where.studentId = session.studentId || "__none__";
  } else if (session.roleCode === ROLES.DEPT_STAFF) {
    where.student = { departmentId: session.departmentId || "__none__" };
  }

  if (departmentId && isCenterOrAdmin(session)) {
    where.student = { ...(where.student as object), departmentId };
  }
  if (reviewStatus) where.verificationStatus = reviewStatus;
  if (studentStatus) {
    where.student = { ...(where.student as object), studentStatus };
  }
  if (q) {
    where.OR = [
      { student: { name: { contains: q } } },
      { student: { studentNo: { contains: q } } },
      { company: { companyName: { contains: q } } },
      { company: { businessRegistrationNo: { contains: q } } },
    ];
  }

  const founders = await prisma.founderCompany.findMany({
    where,
    include: {
      student: { include: { department: true } },
      company: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return jsonOk(founders);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([
    ROLES.STUDENT,
    ROLES.DEPT_STAFF,
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
  ]);
  if (error) return error;

  const body = (await req.json()) as RegisterFounderInput;
  if (!body.studentNo || !body.name || !body.departmentId || !body.companyName) {
    return jsonError("studentNo, name, departmentId, companyName are required.");
  }

  if (session.roleCode === ROLES.STUDENT) {
    const me = session.studentId
      ? await prisma.student.findUnique({ where: { id: session.studentId } })
      : null;
    if (!me || me.studentNo !== body.studentNo) {
      return jsonError("Students can only register their own student number.", 403);
    }
  }

  if (session.roleCode === ROLES.DEPT_STAFF && body.departmentId !== session.departmentId) {
    return jsonError("Department staff can only register their own department.", 403);
  }

  try {
    const result = await registerFounder(session, body);
    await writeAudit({
      userId: session.id,
      action: "FOUNDER_REGISTER",
      entityType: "FounderCompany",
      entityId: result.relation.id,
      detail: { studentNo: body.studentNo, companyName: body.companyName },
    });
    return jsonOk(result, "Registered");
  } catch (e) {
    return jsonError("Registration failed.", 500, e);
  }
}
