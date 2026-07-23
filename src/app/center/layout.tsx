import { AppShell } from "@/components/app-shell";
import { requirePageSession } from "@/lib/session-page";

export default async function CenterLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession(["CENTER_STAFF", "ADMIN"]);
  return <AppShell user={session}>{children}</AppShell>;
}
