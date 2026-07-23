import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { matchPrograms } from "@/lib/recommend";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const studentId = new URL(req.url).searchParams.get("studentId") || session.studentId;
  if (!studentId) return jsonError("studentId is required");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      founderCompanies: { include: { company: true }, take: 1, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!student) return jsonError("Student not found", 404);
  if (!canAccessStudent(session, student)) return jsonError("Forbidden", 403);

  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const company = student.founderCompanies[0]?.company;
  const matched = matchPrograms(programs, student, company);
  return jsonOk(matched);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const studentId = String(body.studentId || "");
  const programId = String(body.programId || "");
  const reason = body.reason ? String(body.reason) : null;
  if (!studentId || !programId) return jsonError("studentId and programId are required");

  const rec = await prisma.programRecommendation.create({
    data: {
      studentId,
      programId,
      recommendedById: session.id,
      reason,
    },
    include: { program: true, student: true },
  });

  await prisma.founderCompany.updateMany({
    where: { studentId },
    data: { pipelineStatus: "PROGRAM_RECOMMENDED" },
  });

  await writeAudit({
    userId: session.id,
    action: "PROGRAM_RECOMMEND",
    entityType: "ProgramRecommendation",
    entityId: rec.id,
  });

  return jsonOk(rec, "Program recommended");
}
