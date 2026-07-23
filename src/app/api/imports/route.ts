import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { autoMapColumns, parseSpreadsheet } from "@/lib/excel/parse";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function GET() {
  const { error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;

  const jobs = await prisma.importJob.findMany({
    include: { createdBy: true, _count: { select: { rows: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk(jobs);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("File is required.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseSpreadsheet(buffer);
  const mapping = autoMapColumns(parsed.headers);

  const uploadDir = path.join(process.cwd(), "uploads", "imports");
  await mkdir(uploadDir, { recursive: true });
  const savedName = `${Date.now()}_${file.name}`;
  await writeFile(path.join(uploadDir, savedName), buffer);

  const job = await prisma.importJob.create({
    data: {
      fileName: file.name,
      status: "MAPPED",
      columnMapping: JSON.stringify(mapping),
      totalRows: parsed.rows.length,
      createdById: session.id,
      rows: {
        create: parsed.rows.map((row, idx) => ({
          rowNumber: idx + 2,
          rawData: JSON.stringify(row),
          status: "PENDING",
        })),
      },
    },
    include: { rows: true },
  });

  await writeAudit({
    userId: session.id,
    action: "IMPORT_UPLOAD",
    entityType: "ImportJob",
    entityId: job.id,
    detail: { fileName: file.name, rows: parsed.rows.length },
  });

  return jsonOk({
    job,
    headers: parsed.headers,
    mapping,
    preview: parsed.rows.slice(0, 20),
  });
}
