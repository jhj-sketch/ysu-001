import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, error } = await requireSession([
    ROLES.DEPT_STAFF,
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
  ]);
  if (error) return error;

  const campaignId = new URL(req.url).searchParams.get("campaignId") || undefined;

  const campaigns = await prisma.campaign.findMany({
    where: campaignId ? { id: campaignId } : undefined,
    include: {
      targets: {
        include: {
          student: { include: { department: true } },
          response: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [];
  for (const campaign of campaigns) {
    const byDept = new Map<
      string,
      {
        departmentId: string;
        departmentName: string;
        total: number;
        completed: number;
        pending: number;
        founders: number;
      }
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
          departmentId: key,
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
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        ...row,
        rate: row.total ? Math.round((row.completed / row.total) * 100) : 0,
      });
    }
  }

  return jsonOk(rows);
}
