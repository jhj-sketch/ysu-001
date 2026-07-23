"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "./ui";

export function ProgramDocUpload({ programId }: { programId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      setMsg("파일을 선택하세요.");
      return;
    }

    setLoading(true);
    setMsg("");
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("programId", programId);
      fd.append("category", "PROGRAM_DOC");
      const res = await fetch("/api/files/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) {
        setLoading(false);
        setMsg(json.message || "업로드 실패");
        return;
      }
    }
    setLoading(false);
    setMsg(`${files.length}건 업로드 완료`);
    form.reset();
    router.refresh();
  }

  return (
    <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={onSubmit}>
      <Input
        type="file"
        name="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
        className="max-w-xs"
      />
      <Button type="submit" variant="secondary" disabled={loading}>
        {loading ? "업로드 중..." : "문서 추가"}
      </Button>
      {msg && <span className="text-xs text-slate-600">{msg}</span>}
    </form>
  );
}
