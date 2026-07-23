import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const studentId = new URL(req.url).searchParams.get("studentId") || undefined;
  const where: Record<string, unknown> = {};

  if (session.roleCode === ROLES.STUDENT) {
    where.studentId = session.studentId || "__none__";
  } else if (studentId) {
    where.studentId = studentId;
  }

  const items = await prisma.programParticipation.findMany({
    where,
    include: { program: true, student: { include: { department: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = items.filter((item) => canAccessStudent(session, item.student));
  return jsonOk(filtered);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const programId = String(body.programId || "");
  const studentId = String(body.studentId || session.studentId || "");
  if (!programId || !studentId) return jsonError("programId and studentId are required");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return jsonError("Student not found", 404);
  if (!canAccessStudent(session, student) && !isCenterOrAdmin(session)) {
    return jsonError("Forbidden", 403);
  }

  const applicationStatus = String(body.applicationStatus || "APPLIED");
  const participationStatus = String(body.participationStatus || "NOT_PARTICIPATED");

  const item = await prisma.programParticipation.upsert({
    where: { programId_studentId: { programId, studentId } },
    update: {
      applicationStatus,
      participationStatus,
      note: body.note || null,
      appliedAt: applicationStatus === "APPLIED" ? new Date() : undefined,
      participatedAt: participationStatus === "COMPLETED" ? new Date() : undefined,
    },
    create: {
      programId,
      studentId,
      applicationStatus,
      participationStatus,
      note: body.note || null,
      appliedAt: applicationStatus === "APPLIED" ? new Date() : null,
      participatedAt: participationStatus === "COMPLETED" ? new Date() : null,
    },
    include: { program: true },
  });

  if (participationStatus === "COMPLETED" || participationStatus === "IN_PROGRESS") {
    await prisma.founderCompany.updateMany({
      where: { studentId },
      data: { pipelineStatus: "PARTICIPATED" },
    });
  } else if (applicationStatus === "APPLIED") {
    await prisma.founderCompany.updateMany({
      where: { studentId },
      data: { pipelineStatus: "APPLIED" },
    });
  }

  await writeAudit({
    userId: session.id,
    action: "PROGRAM_PARTICIPATION",
    entityType: "ProgramParticipation",
    entityId: item.id,
  });

  return jsonOk(item, "Participation saved");
}
