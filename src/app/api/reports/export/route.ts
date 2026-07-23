import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { rowsToWorkbook } from "@/lib/excel/parse";
import { writeAudit } from "@/lib/audit";
import { jsonError } from "@/lib/utils";
import { ROLES, REVIEW_LABEL, STUDENT_STATUS_LABEL } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession([
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
    ROLES.DEPT_STAFF,
  ]);
  if (error) return error;

  const type = new URL(req.url).searchParams.get("type") || "founders";
  let rows: Record<string, unknown>[] = [];
  let sheet = type;

  if (type === "founders") {
    const founders = await prisma.founderCompany.findMany({
      where:
        session.roleCode === ROLES.DEPT_STAFF
          ? { student: { departmentId: session.departmentId || "__none__" } }
          : undefined,
      include: {
        student: { include: { department: true } },
        company: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    rows = founders.map((f) => ({
      studentNo: f.student.studentNo,
      name: f.student.name,
      department: f.student.department.departmentName,
      studentStatus: STUDENT_STATUS_LABEL[f.student.studentStatus] || f.student.studentStatus,
      companyName: f.company.companyName,
      businessRegistrationNo: f.company.businessRegistrationNo || "",
      industry: f.company.industry || "",
      reviewStatus: REVIEW_LABEL[f.verificationStatus] || f.verificationStatus,
      officialStatIncluded: f.officialStatIncluded ? "Y" : "N",
      completeness: f.company.completenessScore,
    }));
  } else if (type === "companies") {
    if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);
    const companies = await prisma.company.findMany({ orderBy: { updatedAt: "desc" } });
    rows = companies.map((c) => ({
      companyName: c.companyName,
      businessRegistrationNo: c.businessRegistrationNo || "",
      representativeName: c.representativeName || "",
      industry: c.industry || "",
      businessType: c.businessType || "",
      address: c.address || "",
      revenue: c.revenue ?? "",
      capital: c.capital ?? "",
      employeeCount: c.employeeCount ?? "",
      completeness: c.completenessScore,
      businessStatus: c.businessStatus,
    }));
  } else if (type === "participations") {
    if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);
    const items = await prisma.programParticipation.findMany({
      include: { program: true, student: { include: { department: true } } },
    });
    rows = items.map((p) => ({
      studentNo: p.student.studentNo,
      name: p.student.name,
      department: p.student.department.departmentName,
      program: p.program.name,
      applicationStatus: p.applicationStatus,
      participationStatus: p.participationStatus,
      appliedAt: p.appliedAt?.toISOString().slice(0, 10) || "",
      participatedAt: p.participatedAt?.toISOString().slice(0, 10) || "",
    }));
  } else if (type === "response-rates") {
    const campaigns = await prisma.campaign.findMany({
      include: {
        targets: {
          include: {
            student: { include: { department: true } },
            response: true,
          },
        },
      },
    });
    for (const campaign of campaigns) {
      const byDept = new Map<
        string,
        { departmentName: string; total: number; completed: number; pending: number; founders: number }
      >();
      for (const t of campaign.targets) {
        if (
          session.roleCode === ROLES.DEPT_STAFF &&
          t.student.departmentId !== session.departmentId
        ) {
          continue;
        }
        const key = t.student.departmentId;
        if (!byDept.has(key)) {
          byDept.set(key, {
            departmentName: t.student.department.departmentName,
            total: 0,
            completed: 0,
            pending: 0,
            founders: 0,
          });
        }
        const row = byDept.get(key)!;
        row.total += 1;
        if (t.status === "COMPLETED") row.completed += 1;
        else row.pending += 1;
        if (t.response?.isFounder) row.founders += 1;
      }
      for (const row of byDept.values()) {
        rows.push({
          campaign: campaign.title,
          department: row.departmentName,
          total: row.total,
          completed: row.completed,
          pending: row.pending,
          founders: row.founders,
          rate: row.total ? Math.round((row.completed / row.total) * 100) : 0,
        });
      }
    }
  } else {
    return jsonError("Unsupported type");
  }

  await writeAudit({
    userId: session.id,
    action: "REPORT_EXPORT",
    entityType: "Report",
    detail: { type, count: rows.length },
  });

  const buffer = rowsToWorkbook(rows, sheet);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${type}.xlsx"`,
    },
  });
}
