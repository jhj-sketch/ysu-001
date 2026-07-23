"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function SurveyCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate, status: "OPEN" }),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <Card title="조사 회차 생성">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="제목" className="md:col-span-2">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="설명" className="md:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="마감일">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">생성</Button>
        </div>
        {msg && <p className="md:col-span-2 text-sm text-slate-600">{msg}</p>}
      </form>
    </Card>
  );
}

export function SurveyUpload({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/surveys/${campaignId}/targets`, {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    setMsg(
      json.success
        ? `생성 ${json.data.created} / 스킵 ${json.data.skipped}`
        : json.message,
    );
    router.refresh();
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={onUpload}>
      <input type="file" name="file" accept=".xlsx,.xls,.csv" required className="text-sm" />
      <Button type="submit" variant="secondary">
        명단 업로드
      </Button>
      {msg && <span className="text-sm text-slate-600">{msg}</span>}
    </form>
  );
}

export function SurveyResponseForm({
  targetId,
  studentNo,
}: {
  targetId: string;
  studentNo: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("UNKNOWN");
  const [msg, setMsg] = useState("");

  async function save() {
    const res = await fetch(`/api/surveys/responses/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postGraduationStatus: status }),
    });
    const json = await res.json();
    setMsg(json.message);
    if (json.data?.needsCompany) {
      router.push(`/department/register?studentNo=${studentNo}&studentStatus=GRADUATED`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="EMPLOYED">취업</option>
        <option value="ADVANCED_STUDY">진학</option>
        <option value="FOUNDED">창업</option>
        <option value="UNKNOWN">미상</option>
        <option value="OTHER">기타</option>
      </select>
      <Button type="button" variant="secondary" onClick={save}>
        저장
      </Button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
