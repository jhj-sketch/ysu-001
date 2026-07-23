import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Login required.", 401);
  return jsonOk(session);
}
