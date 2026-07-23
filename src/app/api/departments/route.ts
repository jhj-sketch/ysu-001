import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonOk } from "@/lib/utils";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { departmentName: "asc" },
  });
  return jsonOk(departments);
}
