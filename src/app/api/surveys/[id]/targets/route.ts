import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { parseSpreadsheet } from "@/lib/excel/parse";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("권한이 없습니다.", 403);

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return jsonError("조사를 찾을 수 없습니다.", 404);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("파일을 업로드하세요.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows } = parseSpreadsheet(buffer);

  const departments = await prisma.department.findMany();
  const deptByName = new Map(departments.map((d) => [d.departmentName, d]));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const studentNo = row["학번"] || row["studentNo"] || row["학생번호"];
    const name = row["이름"] || row["성명"] || row["name"];
    const departmentName = row["학과"] || row["학과명"] || row["department"];
    if (!studentNo || !name) {
      errors.push(`${i + 2}행: 학번/이름 누락`);
      skipped++;
      continue;
    }

    let department = departmentName ? deptByName.get(departmentName) : null;
    if (!department) department = departments[0];
    if (!department) {
      errors.push(`${i + 2}행: 학과 없음`);
      skipped++;
      continue;
    }

    const student = await prisma.student.upsert({
      where: { studentNo },
      update: {
        name,
        departmentId: department.id,
        studentStatus: "GRADUATED",
      },
      create: {
        studentNo,
        name,
        departmentId: department.id,
        studentStatus: "GRADUATED",
        dataSource: "SURVEY",
      },
    });

    try {
      await prisma.surveyTarget.create({
        data: { campaignId: id, studentId: student.id, status: "NOT_STARTED" },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  await writeAudit({
    userId: session.id,
    action: "SURVEY_TARGETS_IMPORT",
    entityType: "Campaign",
    entityId: id,
    detail: { created, skipped, fileName: file.name },
  });

  return jsonOk({ created, skipped, errors }, "대상자 업로드 완료");
}
