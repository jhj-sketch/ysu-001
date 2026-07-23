import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const { error } = await requireSession([ROLES.ADMIN, ROLES.CENTER_STAFF]);
  if (error) return error;
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return jsonOk(logs);
}
