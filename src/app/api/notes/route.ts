import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession([
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
    ROLES.DEPT_STAFF,
  ]);
  if (error) return error;

  const studentId = new URL(req.url).searchParams.get("studentId");
  if (!studentId) return jsonError("studentId is required");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return jsonError("Student not found", 404);
  if (!canAccessStudent(session, student)) return jsonError("Forbidden", 403);

  const notes = await prisma.consultationNote.findMany({
    where: { studentId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk(notes);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const studentId = String(body.studentId || "");
  const content = String(body.content || "").trim();
  if (!studentId || !content) return jsonError("studentId and content are required");

  const note = await prisma.consultationNote.create({
    data: { studentId, authorId: session.id, content },
    include: { author: true },
  });

  await writeAudit({
    userId: session.id,
    action: "CONSULTATION_NOTE",
    entityType: "ConsultationNote",
    entityId: note.id,
  });

  return jsonOk(note, "Note saved");
}
