import { clearSessionCookie, getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { jsonOk } from "@/lib/utils";

export async function POST() {
  const session = await getSession();
  if (session) {
    await writeAudit({ userId: session.id, action: "LOGOUT", entityType: "User", entityId: session.id });
  }
  await clearSessionCookie();
  return jsonOk(null, "Logout success");
}
