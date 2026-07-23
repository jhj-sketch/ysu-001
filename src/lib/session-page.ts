import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { RoleCode } from "@/lib/constants";

export async function requirePageSession(roles?: RoleCode[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.roleCode)) redirect("/");
  return session;
}
