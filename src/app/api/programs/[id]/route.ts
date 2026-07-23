import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("권한이 없습니다.", 403);

  const { id } = await params;
  const body = await req.json();

  const program = await prisma.program.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      targetStatuses: body.targetStatuses,
      industryKeywords: body.industryKeywords,
      applyUrl: body.applyUrl,
      applyStartDate: body.applyStartDate ? new Date(body.applyStartDate) : undefined,
      applyEndDate: body.applyEndDate ? new Date(body.applyEndDate) : undefined,
      isActive: body.isActive,
    },
  });

  return jsonOk(program);
}
