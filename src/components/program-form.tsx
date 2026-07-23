"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "./ui";

export function ProgramForm() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<FileList | null>(null);
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
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.success) {
      setLoading(false);
      setMsg(json.message || "등록 실패");
      return;
    }

    const programId = json.data.id as string;
    if (docs?.length) {
      for (const file of Array.from(docs)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("programId", programId);
        fd.append("category", "PROGRAM_DOC");
        const uploadRes = await fetch("/api/files/upload", { method: "POST", body: fd });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) {
          setLoading(false);
          setMsg(`프로그램은 등록되었으나 문서 업로드 실패: ${uploadJson.message}`);
          router.refresh();
          return;
        }
      }
    }

    const uploadedCount = docs?.length || 0;
    setLoading(false);
    setDocs(null);
    setForm({
      name: "",
      description: "",
      targetStatuses: "ENROLLED,GRADUATED",
      industryKeywords: "전체",
      applyUrl: "",
      applyStartDate: "",
      applyEndDate: "",
    });
    setMsg(
      uploadedCount
        ? `등록되었습니다. 문서 ${uploadedCount}건이 첨부되었습니다.`
        : "등록되었습니다.",
    );
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
        <Field label="프로그램 안내 문서" className="md:col-span-2">
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setDocs(e.target.files)}
          />
          <p className="mt-1 text-xs text-slate-500">
            모집요강, 신청서 양식 등. PDF/워드/엑셀/이미지, 여러 파일 가능 (파일당 최대 15MB).
          </p>
          {docs?.length ? (
            <p className="mt-1 text-sm text-teal-700">{docs.length}개 파일 선택됨</p>
          ) : null}
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? "등록 중..." : "등록"}
          </Button>
          {msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}
