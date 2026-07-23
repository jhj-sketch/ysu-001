import { createReadStream } from "fs";
import { access, constants } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { jsonError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return jsonError("File not found", 404);

  if (attachment.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: attachment.companyId },
      include: {
        founderCompanies: { include: { student: true } },
      },
    });
    if (!company) return jsonError("File not found", 404);
    const allowed =
      isCenterOrAdmin(session) ||
      company.founderCompanies.some((fc) => canAccessStudent(session, fc.student));
    if (!allowed) return jsonError("Forbidden", 403);
  } else if (session.roleCode === "STUDENT" && attachment.studentId !== session.studentId) {
    return jsonError("Forbidden", 403);
  } else if (!isCenterOrAdmin(session) && session.roleCode !== "DEPT_STAFF") {
    return jsonError("Forbidden", 403);
  }

  const absolutePath = path.isAbsolute(attachment.filePath)
    ? attachment.filePath
    : path.join(process.cwd(), attachment.filePath);

  try {
    await access(absolutePath, constants.R_OK);
  } catch {
    return jsonError("File missing on server", 404);
  }

  const stream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    },
  });
}
