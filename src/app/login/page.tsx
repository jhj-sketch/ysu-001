"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { ROLE_HOME, type RoleCode } from "@/lib/constants";

const DEMOS = [
  { email: "center@univ.ac.kr", label: "센터 담당자" },
  { email: "dept@univ.ac.kr", label: "학과 담당자" },
  { email: "student@univ.ac.kr", label: "학생" },
  { email: "admin@univ.ac.kr", label: "관리자" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("center@univ.ac.kr");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.message || "로그인 실패");
      return;
    }
    const role = json.data.roleCode as RoleCode;
    router.push(ROLE_HOME[role]);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ccfbf1,transparent_45%),linear-gradient(180deg,#0f766e,#134e4a)] px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Startup Registry
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">대학 창업자 현황 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            재학생·졸업생 창업자 레지스트리 및 지원 연계
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="이메일">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </Field>
          <Field label="비밀번호">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-500">데모 계정 (비밀번호: password123)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="rounded-md border border-slate-200 px-2 py-2 text-left text-xs hover:bg-slate-50"
                onClick={() => {
                  setEmail(d.email);
                  setPassword("password123");
                }}
              >
                <div className="font-medium text-slate-800">{d.label}</div>
                <div className="truncate text-slate-500">{d.email}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
