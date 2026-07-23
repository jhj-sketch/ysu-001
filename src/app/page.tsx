import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(ROLE_HOME[session.roleCode]);
  }
  redirect("/login");
}
