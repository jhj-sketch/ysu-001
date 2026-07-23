import { AppShell } from "@/components/app-shell";
import { requirePageSession } from "@/lib/session-page";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession(["STUDENT", "ADMIN"]);
  return <AppShell user={session}>{children}</AppShell>;
}
