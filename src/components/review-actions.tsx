"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "./ui";

export function ReviewActions({ founderId }: { founderId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  async function review(reviewStatus: string) {
    const res = await fetch(`/api/founders/${founderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus, reviewNote: note }),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={3}
        placeholder="검토 메모 (반려/보완요청 시)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => review("REVIEWING")} variant="secondary">
          확인중
        </Button>
        <Button onClick={() => review("APPROVED")}>승인</Button>
        <Button onClick={() => review("NEEDS_MORE_INFO")} variant="secondary">
          보완요청
        </Button>
        <Button onClick={() => review("REJECTED")} variant="danger">
          반려
        </Button>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
