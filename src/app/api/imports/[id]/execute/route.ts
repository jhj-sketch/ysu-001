import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { calcCompletenessScore } from "@/lib/completeness";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk, normalizeBizNo } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("권한이 없습니다.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const mapping = (body.mapping || {}) as Record<string, string>;

  const job = await prisma.importJob.findUnique({
    where: { id },
    include: { rows: true },
  });
  if (!job) return jsonError("가져오기 작업을 찾을 수 없습니다.", 404);

  const departments = await prisma.department.findMany();
  const deptByName = new Map(departments.map((d) => [d.departmentName, d]));

  let success = 0;
  let fail = 0;

  for (const row of job.rows) {
    const raw = JSON.parse(row.rawData) as Record<string, string>;
    const get = (field: string) => {
      const header = mapping[field];
      return header ? (raw[header] || "").trim() : "";
    };

    try {
      const studentNo = get("studentNo");
      const name = get("name");
      const companyName = get("companyName");
      if (!studentNo || !name || !companyName) {
        throw new Error("학번/이름/기업명 필수");
      }

      const deptName = get("departmentName");
      const department = (deptName && deptByName.get(deptName)) || departments[0];
      if (!department) throw new Error("학과 없음");

      const bizNo = normalizeBizNo(get("businessRegistrationNo"));
      const studentStatus = get("studentStatus") || "ENROLLED";

      const student = await prisma.student.upsert({
        where: { studentNo },
        update: {
          name,
          departmentId: department.id,
          studentStatus,
          email: get("email") || undefined,
          phone: get("phone") || undefined,
        },
        create: {
          studentNo,
          name,
          departmentId: department.id,
          studentStatus,
          email: get("email") || null,
          phone: get("phone") || null,
          dataSource: "IMPORT",
        },
      });

      const companyPayload = {
        companyName,
        businessRegistrationNo: bizNo,
        representativeName: get("representativeName") || name,
        industry: get("industry") || null,
        businessType: get("businessType") || null,
        address: get("address") || null,
        foundedDate: get("foundedDate") ? new Date(get("foundedDate")) : null,
      };
      const completenessScore = calcCompletenessScore(companyPayload);

      let company = bizNo
        ? await prisma.company.findUnique({ where: { businessRegistrationNo: bizNo } })
        : null;

      if (company) {
        company = await prisma.company.update({
          where: { id: company.id },
          data: { ...companyPayload, completenessScore },
        });
      } else {
        company = await prisma.company.create({
          data: { ...companyPayload, completenessScore },
        });
      }

      await prisma.founderCompany.upsert({
        where: {
          studentId_companyId: { studentId: student.id, companyId: company.id },
        },
        update: { verificationStatus: "SUBMITTED" },
        create: {
          studentId: student.id,
          companyId: company.id,
          verificationStatus: "SUBMITTED",
          registeredByUserId: session.id,
        },
      });

      await prisma.submission.create({
        data: {
          studentId: student.id,
          companyId: company.id,
          channel: "IMPORT",
          reviewStatus: "SUBMITTED",
          createdByUserId: session.id,
          submittedAt: new Date(),
        },
      });

      await prisma.importRow.update({
        where: { id: row.id },
        data: { status: "SUCCESS", errorMessage: null },
      });
      success++;
    } catch (e) {
      await prisma.importRow.update({
        where: { id: row.id },
        data: {
          status: "ERROR",
          errorMessage: e instanceof Error ? e.message : "오류",
        },
      });
      fail++;
    }
  }

  const updated = await prisma.importJob.update({
    where: { id },
    data: {
      status: "COMPLETED",
      columnMapping: JSON.stringify(mapping),
      successRows: success,
      errorRows: fail,
      executedAt: new Date(),
    },
  });

  await writeAudit({
    userId: session.id,
    action: "IMPORT_EXECUTE",
    entityType: "ImportJob",
    entityId: id,
    detail: { success, fail },
  });

  return jsonOk(updated, `가져오기 완료 (성공 ${success}, 실패 ${fail})`);
}
