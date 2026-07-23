import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const { session, error } = await requireSession([
    ROLES.DEPT_STAFF,
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
  ]);
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    include: {
      targets: {
        include: {
          student: { include: { department: true } },
          response: true,
        },
      },
      _count: { select: { targets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered =
    session.roleCode === ROLES.DEPT_STAFF
      ? campaigns.map((c) => ({
          ...c,
          targets: c.targets.filter((t) => t.student.departmentId === session.departmentId),
        }))
      : campaigns;

  return jsonOk(filtered);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return jsonError("title is required");

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description: body.description || null,
      status: body.status || "OPEN",
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  await writeAudit({
    userId: session.id,
    action: "CAMPAIGN_CREATE",
    entityType: "Campaign",
    entityId: campaign.id,
    detail: { title },
  });

  return jsonOk(campaign, "Campaign created");
}
