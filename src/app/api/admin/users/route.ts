import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error } = await requireSession([ROLES.ADMIN]);
  if (error) return error;
  const users = await prisma.user.findMany({
    include: { department: true, student: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk(users.map(({ passwordHash: _pw, ...u }) => u));
}

export async function POST(req: Request) {
  const { error } = await requireSession([ROLES.ADMIN]);
  if (error) return error;

  const body = await req.json();
  if (!body.email || !body.name || !body.roleCode || !body.password) {
    return jsonError("email, name, roleCode, password are required");
  }

  const passwordHash = await bcrypt.hash(String(body.password), 10);
  const user = await prisma.user.create({
    data: {
      loginId: body.loginId || body.email,
      email: body.email,
      name: body.name,
      roleCode: body.roleCode,
      departmentId: body.departmentId || null,
      studentId: body.studentId || null,
      passwordHash,
    },
  });

  const { passwordHash: _pw, ...safe } = user;
  return jsonOk(safe, "User created");
}
