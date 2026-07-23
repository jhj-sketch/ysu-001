"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field } from "./ui";

const FIELDS = [
  "studentNo",
  "name",
  "departmentName",
  "studentStatus",
  "companyName",
  "businessRegistrationNo",
  "representativeName",
  "industry",
  "businessType",
  "address",
  "foundedDate",
  "email",
  "phone",
];

export function ImportPanel() {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [msg, setMsg] = useState("");

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/imports", { method: "POST", body: form });
    const json = await res.json();
    if (!json.success) {
      setMsg(json.message);
      return;
    }
    setJobId(json.data.job.id);
    setHeaders(json.data.headers);
    setMapping(json.data.mapping);
    setPreview(json.data.preview);
    setMsg(`업로드 완료: ${json.data.job.totalRows}행`);
  }

  async function execute() {
    const res = await fetch(`/api/imports/${jobId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapping }),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card title="1. 파일 업로드">
        <form className="flex flex-wrap items-center gap-2" onSubmit={onUpload}>
          <input type="file" name="file" accept=".xlsx,.xls,.csv" required />
          <Button type="submit">업로드·미리보기</Button>
        </form>
      </Card>

      {jobId && (
        <Card title="2. 컬럼 매핑">
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map((field) => (
              <Field key={field} label={field}>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={mapping[field] || ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                >
                  <option value="">(미매핑)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={execute}>가져오기 실행</Button>
            <a
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              href={`/api/imports/${jobId}/errors`}
            >
              오류 행 다운로드
            </a>
          </div>
        </Card>
      )}

      {preview.length > 0 && (
        <Card title="미리보기 (최대 20행)">
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </Card>
      )}
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </div>
  );
}
