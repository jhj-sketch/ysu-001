import Link from "next/link";
import { ROLE_LABEL, type RoleCode } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

type NavItem = { href: string; label: string };

const NAV: Record<RoleCode, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "대시보드" },
    { href: "/student/register", label: "창업정보 등록" },
    { href: "/student/companies", label: "내 기업" },
    { href: "/student/programs", label: "추천 프로그램" },
  ],
  DEPT_STAFF: [
    { href: "/department", label: "학과 대시보드" },
    { href: "/department/register", label: "창업자 등록" },
    { href: "/department/surveys", label: "졸업자 조사" },
  ],
  CENTER_STAFF: [
    { href: "/center", label: "전체 대시보드" },
    { href: "/center/founders", label: "창업자" },
    { href: "/center/companies", label: "기업" },
    { href: "/center/register", label: "등록" },
    { href: "/center/surveys", label: "졸업자 조사" },
    { href: "/center/response-rates", label: "응답률" },
    { href: "/center/imports", label: "엑셀 가져오기" },
    { href: "/center/programs", label: "프로그램" },
    { href: "/center/reports", label: "성과보고" },
  ],
  ADMIN: [
    { href: "/admin", label: "관리자 홈" },
    { href: "/admin/users", label: "사용자" },
    { href: "/admin/departments", label: "학과" },
    { href: "/admin/audit", label: "감사 로그" },
    { href: "/center", label: "센터 화면" },
  ],
};

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const items = NAV[user.roleCode] || [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f7f5_0%,#f8fafc_240px,#f8fafc_100%)]">
      <header className="border-b border-teal-900/10 bg-teal-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-sm font-semibold tracking-wide">대학 창업자 현황 관리</div>
            <div className="text-xs text-teal-100/80">Student Founder Registry</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-teal-100/80">{ROLE_LABEL[user.roleCode]}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
