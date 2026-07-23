import { AppShell } from "@/components/app-shell";
import { requirePageSession } from "@/lib/session-page";

export default async function DepartmentLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession(["DEPT_STAFF", "CENTER_STAFF", "ADMIN"]);
  return <AppShell user={session}>{children}</AppShell>;
}
