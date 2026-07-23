import { createSessionToken, loginWithPassword, setSessionCookie } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");

  if (!email || !password) {
    return jsonError("Email and password are required.");
  }

  const user = await loginWithPassword(email, password);
  if (!user) return jsonError("Invalid login credentials.", 401);

  const token = await createSessionToken(user);
  await setSessionCookie(token);
  await writeAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });

  return jsonOk(user, "Login success");
}
