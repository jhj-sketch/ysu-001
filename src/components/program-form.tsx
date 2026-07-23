"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function ProgramForm() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetStatuses: "ENROLLED,GRADUATED",
    industryKeywords: "전체",
    applyUrl: "",
    applyStartDate: "",
    applyEndDate: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <Card title="프로그램 등록">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="프로그램명" className="md:col-span-2">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="설명" className="md:col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="대상 신분 (쉼표구분)">
          <Input
            value={form.targetStatuses}
            onChange={(e) => setForm({ ...form, targetStatuses: e.target.value })}
          />
        </Field>
        <Field label="업종 키워드">
          <Input
            value={form.industryKeywords}
            onChange={(e) => setForm({ ...form, industryKeywords: e.target.value })}
          />
        </Field>
        <Field label="신청 URL">
          <Input
            value={form.applyUrl}
            onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
          />
        </Field>
        <Field label="신청 시작">
          <Input
            type="date"
            value={form.applyStartDate}
            onChange={(e) => setForm({ ...form, applyStartDate: e.target.value })}
          />
        </Field>
        <Field label="신청 종료">
          <Input
            type="date"
            value={form.applyEndDate}
            onChange={(e) => setForm({ ...form, applyEndDate: e.target.value })}
          />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">등록</Button>
          {msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}
