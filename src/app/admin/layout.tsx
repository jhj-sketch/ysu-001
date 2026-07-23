import { AppShell } from "@/components/app-shell";
import { requirePageSession } from "@/lib/session-page";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession(["ADMIN"]);
  return <AppShell user={session}>{children}</AppShell>;
}
