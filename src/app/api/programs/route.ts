import { prisma } from "@/lib/prisma";
import { requireSession, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const programs = await prisma.program.findMany({ orderBy: { createdAt: "desc" } });
  return jsonOk(programs);
}

export async function POST(req: Request) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("Forbidden", 403);

  const body = await req.json();
  if (!body.name || !body.targetStatuses) {
    return jsonError("name and targetStatuses are required");
  }

  const program = await prisma.program.create({
    data: {
      name: String(body.name),
      description: body.description || null,
      targetStatuses: String(body.targetStatuses),
      industryKeywords: body.industryKeywords || null,
      applyUrl: body.applyUrl || null,
      applyStartDate: body.applyStartDate ? new Date(body.applyStartDate) : null,
      applyEndDate: body.applyEndDate ? new Date(body.applyEndDate) : null,
      isActive: body.isActive !== false,
    },
  });

  await writeAudit({
    userId: session.id,
    action: "PROGRAM_CREATE",
    entityType: "Program",
    entityId: program.id,
  });

  return jsonOk(program, "Program created");
}
