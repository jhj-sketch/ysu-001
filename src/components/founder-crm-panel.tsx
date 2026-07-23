"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea } from "./ui";

type Program = { id: string; name: string };

export function FounderCrmPanel({
  studentId,
  programs,
}: {
  studentId: string;
  programs: Program[];
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(programs[0]?.id || "");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [appStatus, setAppStatus] = useState("APPLIED");
  const [partStatus, setPartStatus] = useState("NOT_PARTICIPATED");
  const [msg, setMsg] = useState("");

  async function recommend() {
    const res = await fetch("/api/programs/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, programId, reason }),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  async function saveParticipation() {
    const res = await fetch("/api/programs/participations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        programId,
        applicationStatus: appStatus,
        participationStatus: partStatus,
      }),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  async function saveNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, content: note }),
    });
    const json = await res.json();
    setMsg(json.message);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="프로그램">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="추천 사유">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={recommend}>프로그램 안내</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="신청 상태">
          <Select value={appStatus} onChange={(e) => setAppStatus(e.target.value)}>
            <option value="NOT_APPLIED">미신청</option>
            <option value="INTENDS_TO_APPLY">신청예정</option>
            <option value="APPLIED">신청</option>
            <option value="SELECTED">선정</option>
            <option value="NOT_SELECTED">미선정</option>
          </Select>
        </Field>
        <Field label="참여 상태">
          <Select value={partStatus} onChange={(e) => setPartStatus(e.target.value)}>
            <option value="NOT_PARTICIPATED">미참여</option>
            <option value="IN_PROGRESS">진행중</option>
            <option value="COMPLETED">완료</option>
            <option value="DROPPED">중도포기</option>
          </Select>
        </Field>
      </div>
      <Button variant="secondary" onClick={saveParticipation}>
        신청/참여 저장
      </Button>
      <Field label="상담 메모">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Button variant="secondary" onClick={saveNote}>
        메모 저장
      </Button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
