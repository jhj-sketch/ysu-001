"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select } from "./ui";

export function AdminUserForm({
  departments,
}: {
  departments: { id: string; departmentName: string }[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <Card title="사용자 추가">
      <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
        <Field label="이름">
          <Input name="name" required />
        </Field>
        <Field label="이메일">
          <Input name="email" type="email" required />
        </Field>
        <Field label="비밀번호">
          <Input name="password" type="password" required />
        </Field>
        <Field label="역할">
          <Select name="roleCode" defaultValue="DEPT_STAFF">
            <option value="STUDENT">학생</option>
            <option value="DEPT_STAFF">학과 담당자</option>
            <option value="CENTER_STAFF">센터 담당자</option>
            <option value="ADMIN">관리자</option>
          </Select>
        </Field>
        <Field label="학과">
          <Select name="departmentId" defaultValue="">
            <option value="">없음</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit">추가</Button>
        </div>
        {msg && <p className="md:col-span-3 text-sm text-slate-600">{msg}</p>}
      </form>
    </Card>
  );
}

export function AdminDepartmentForm() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const json = await res.json();
    setMsg(json.message);
    router.refresh();
  }

  return (
    <Card title="학과 추가">
      <form className="grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
        <Field label="코드">
          <Input name="departmentCode" required />
        </Field>
        <Field label="학과명">
          <Input name="departmentName" required />
        </Field>
        <Field label="단과대학">
          <Input name="collegeName" />
        </Field>
        <div className="flex items-end">
          <Button type="submit">추가</Button>
        </div>
        {msg && <p className="md:col-span-4 text-sm text-slate-600">{msg}</p>}
      </form>
    </Card>
  );
}
