import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const { error } = await requireSession([ROLES.ADMIN, ROLES.CENTER_STAFF]);
  if (error) return error;
  return jsonOk(await prisma.department.findMany({ orderBy: { departmentName: "asc" } }));
}

export async function POST(req: Request) {
  const { error } = await requireSession([ROLES.ADMIN]);
  if (error) return error;
  const body = await req.json();
  if (!body.departmentCode || !body.departmentName) {
    return jsonError("departmentCode and departmentName are required");
  }
  const dept = await prisma.department.create({
    data: {
      departmentCode: body.departmentCode,
      departmentName: body.departmentName,
      collegeName: body.collegeName || null,
      officeEmail: body.officeEmail || null,
      officePhone: body.officePhone || null,
    },
  });
  return jsonOk(dept, "Department created");
}
