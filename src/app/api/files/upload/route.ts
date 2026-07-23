import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const form = await req.formData();
  const file = form.get("file");
  const companyId = form.get("companyId")?.toString() || null;
  const category = form.get("category")?.toString() || "BUSINESS_LICENSE";

  if (!(file instanceof File)) return jsonError("File is required.");

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const ext = path.extname(file.name).toLowerCase();
  const allowedExt = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (!allowedExt.includes(ext) && file.type && !allowedTypes.includes(file.type)) {
    return jsonError("Only PDF or image files are allowed for business license.");
  }
  if (file.size > 10 * 1024 * 1024) {
    return jsonError("File size must be 10MB or less.");
  }

  const uploadDir = path.join(process.cwd(), "uploads", "attachments");
  await mkdir(uploadDir, { recursive: true });
  const saved = `${randomUUID()}${ext || ""}`;
  const fullPath = path.join(uploadDir, saved);
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  const attachment = await prisma.attachment.create({
    data: {
      companyId,
      studentId: session.studentId,
      fileName: file.name,
      filePath: path.join("uploads", "attachments", saved).replace(/\\/g, "/"),
      mimeType: file.type || null,
      fileSize: file.size,
      category: category || "BUSINESS_LICENSE",
      uploadedById: session.id,
    },
  });

  await writeAudit({
    userId: session.id,
    action: "FILE_UPLOAD",
    entityType: "Attachment",
    entityId: attachment.id,
    detail: { fileName: file.name, companyId },
  });

  return jsonOk(attachment, "Uploaded");
}
