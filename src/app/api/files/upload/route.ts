import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ROLES } from "@/lib/constants";
import { getUploadRoot, toRelativeUploadPath } from "@/lib/storage-path";

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const form = await req.formData();
  const file = form.get("file");
  const companyId = form.get("companyId")?.toString() || null;
  const studentIdFromForm = form.get("studentId")?.toString() || null;
  const programId = form.get("programId")?.toString() || null;
  const category = form.get("category")?.toString() || "OTHER";

  if (!(file instanceof File)) return jsonError("File is required.");

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const ext = path.extname(file.name).toLowerCase();
  const allowedExt = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
  ];
  if (!allowedExt.includes(ext) && file.type && !allowedTypes.includes(file.type)) {
    return jsonError("Unsupported file type.");
  }
  if (file.size > 15 * 1024 * 1024) {
    return jsonError("File size must be 15MB or less.");
  }

  if (programId) {
    if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return jsonError("Program not found", 404);
  }

  let studentId = studentIdFromForm || session.studentId || null;
  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return jsonError("Student not found", 404);
    if (!canAccessStudent(session, student) && !isCenterOrAdmin(session)) {
      return jsonError("Forbidden", 403);
    }
  } else if (!programId && !companyId && session.roleCode === ROLES.STUDENT) {
    return jsonError("Student id is required", 400);
  }

  const uploadDir = path.join(getUploadRoot(), "attachments");
  await mkdir(uploadDir, { recursive: true });
  const saved = `${randomUUID()}${ext || ""}`;
  const fullPath = path.join(uploadDir, saved);
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  const storedPath = process.env.VERCEL
    ? fullPath.replace(/\\/g, "/")
    : toRelativeUploadPath("uploads", "attachments", saved);

  const attachment = await prisma.$transaction(async (tx) => {
    const created = await tx.attachment.create({
      data: {
        companyId,
        studentId,
        programId,
        fileName: file.name,
        filePath: storedPath,
        mimeType: file.type || null,
        fileSize: file.size,
        category: programId ? category || "PROGRAM_DOC" : category,
        uploadedById: session.id,
      },
    });

    if (category === "PRIVACY_CONSENT" && studentId) {
      await tx.consent.create({
        data: {
          studentId,
          userId: session.id,
          consentType: "PRIVACY",
          agreed: true,
        },
      });
    }

    return created;
  });

  await writeAudit({
    userId: session.id,
    action: "FILE_UPLOAD",
    entityType: "Attachment",
    entityId: attachment.id,
    detail: { fileName: file.name, companyId, studentId, programId, category },
  });

  return jsonOk(attachment, "Uploaded");
}
