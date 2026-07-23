"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function StudentProgramActions({
  programId,
  studentId,
}: {
  programId: string;
  studentId: string;
}) {
  const router = useRouter();

  async function mark(applicationStatus: string, participationStatus: string) {
    await fetch("/api/programs/participations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programId, studentId, applicationStatus, participationStatus }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => mark("INTENDS_TO_APPLY", "NOT_PARTICIPATED")}>
        관심 있음
      </Button>
      <Button onClick={() => mark("APPLIED", "NOT_PARTICIPATED")}>신청함</Button>
      <Button variant="secondary" onClick={() => mark("APPLIED", "COMPLETED")}>
        참여함
      </Button>
    </div>
  );
}
