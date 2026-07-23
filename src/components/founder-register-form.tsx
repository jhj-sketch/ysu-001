"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select } from "./ui";

type Dept = { id: string; departmentName: string };

export function FounderRegisterForm({
  defaults,
  lockStudentNo,
}: {
  defaults?: Partial<{
    studentNo: string;
    name: string;
    departmentId: string;
    studentStatus: string;
    email: string;
    phone: string;
  }>;
  lockStudentNo?: boolean;
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [message, setMessage] = useState("");
  const [dup, setDup] = useState("");
  const [loading, setLoading] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    studentNo: defaults?.studentNo || "",
    name: defaults?.name || "",
    departmentId: defaults?.departmentId || "",
    studentStatus: defaults?.studentStatus || "ENROLLED",
    email: defaults?.email || "",
    phone: defaults?.phone || "",
    companyName: "",
    businessRegistrationNo: "",
    representativeName: "",
    industry: "",
    businessType: "",
    address: "",
    foundedDate: "",
    revenue: "",
    capital: "",
    employeeCount: "",
    founderRole: "CEO",
    consentPrivacy: true,
    reviewStatus: "SUBMITTED" as "DRAFT" | "SUBMITTED",
  });

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((j) => {
        setDepartments(j.data || []);
        if (!form.departmentId && j.data?.[0]) {
          setForm((f) => ({ ...f, departmentId: defaults?.departmentId || j.data[0].id }));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkDup() {
    const qs = new URLSearchParams();
    if (form.studentNo) qs.set("studentNo", form.studentNo);
    if (form.businessRegistrationNo) qs.set("businessRegistrationNo", form.businessRegistrationNo);
    const res = await fetch(`/api/founders/check-duplicate?${qs}`);
    const json = await res.json();
    if (!json.success) return;
    const parts = [];
    if (json.data.studentExists) parts.push("동일 학번 존재");
    if (json.data.companyExists) parts.push("동일 사업자번호 존재 (갱신/공동창업 가능)");
    setDup(parts.length ? parts.join(" · ") : "중복 없음");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/founders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        revenue: form.revenue ? Number(form.revenue) : null,
        capital: form.capital ? Number(form.capital) : null,
        employeeCount: form.employeeCount ? Number(form.employeeCount) : null,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      setLoading(false);
      setMessage(json.message || "등록 실패");
      return;
    }

    if (licenseFile && json.data?.company?.id) {
      const fd = new FormData();
      fd.append("file", licenseFile);
      fd.append("companyId", json.data.company.id);
      fd.append("category", "BUSINESS_LICENSE");
      const uploadRes = await fetch("/api/files/upload", { method: "POST", body: fd });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        setLoading(false);
        setMessage(`등록은 완료되었으나 사업자등록증 업로드에 실패했습니다: ${uploadJson.message}`);
        router.refresh();
        return;
      }
    }

    const uploadedLicense = Boolean(licenseFile);
    setLoading(false);
    setLicenseFile(null);
    setMessage(
      uploadedLicense
        ? "등록되었습니다. 사업자등록증이 함께 저장되었습니다."
        : "등록되었습니다.",
    );
    router.refresh();
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Card title="창업정보 등록" description="학생·기업 정보를 분리 저장하며 학번/사업자번호 중복을 검사합니다.">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="학번">
          <Input
            required
            value={form.studentNo}
            disabled={lockStudentNo}
            onChange={(e) => set("studentNo", e.target.value)}
            onBlur={checkDup}
          />
        </Field>
        <Field label="이름">
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="학과">
          <Select
            required
            value={form.departmentId}
            onChange={(e) => set("departmentId", e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="학적 상태">
          <Select value={form.studentStatus} onChange={(e) => set("studentStatus", e.target.value)}>
            <option value="ENROLLED">재학생</option>
            <option value="LEAVE">휴학생</option>
            <option value="GRADUATED">졸업생</option>
          </Select>
        </Field>
        <Field label="이메일">
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="연락처">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>

        <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-800">
          기업 정보
        </div>

        <Field label="기업명">
          <Input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </Field>
        <Field label="사업자등록번호 (선택)">
          <Input
            value={form.businessRegistrationNo}
            onChange={(e) => set("businessRegistrationNo", e.target.value)}
            onBlur={checkDup}
            placeholder="예비창업은 비워둘 수 있음"
          />
        </Field>
        <Field label="대표자명">
          <Input
            value={form.representativeName}
            onChange={(e) => set("representativeName", e.target.value)}
          />
        </Field>
        <Field label="창업 역할">
          <Select value={form.founderRole} onChange={(e) => set("founderRole", e.target.value)}>
            <option value="CEO">대표</option>
            <option value="CO_CEO">공동대표</option>
          </Select>
        </Field>
        <Field label="업종">
          <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
        </Field>
        <Field label="업태/종목">
          <Input value={form.businessType} onChange={(e) => set("businessType", e.target.value)} />
        </Field>
        <Field label="주소" className="md:col-span-2">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="창업일">
          <Input
            type="date"
            value={form.foundedDate}
            onChange={(e) => set("foundedDate", e.target.value)}
          />
        </Field>
        <Field label="매출">
          <Input value={form.revenue} onChange={(e) => set("revenue", e.target.value)} />
        </Field>
        <Field label="자본금">
          <Input value={form.capital} onChange={(e) => set("capital", e.target.value)} />
        </Field>
        <Field label="고용인원">
          <Input value={form.employeeCount} onChange={(e) => set("employeeCount", e.target.value)} />
        </Field>

        <Field label="사업자등록증 첨부" className="md:col-span-2">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
            onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF 또는 이미지(JPG/PNG 등), 최대 10MB. 선택 사항입니다.
          </p>
          {licenseFile && (
            <p className="mt-1 text-sm text-teal-700">선택됨: {licenseFile.name}</p>
          )}
        </Field>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.consentPrivacy}
              onChange={(e) => set("consentPrivacy", e.target.checked)}
            />
            개인정보 수집·이용 동의
          </label>
          <Select
            className="w-40"
            value={form.reviewStatus}
            onChange={(e) => set("reviewStatus", e.target.value as "DRAFT" | "SUBMITTED")}
          >
            <option value="DRAFT">임시저장</option>
            <option value="SUBMITTED">제출</option>
          </Select>
          <Button type="button" variant="secondary" onClick={checkDup}>
            중복 검사
          </Button>
          <Button disabled={loading || !form.consentPrivacy}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
        {dup && <p className="md:col-span-2 text-sm text-teal-700">{dup}</p>}
        {message && <p className="md:col-span-2 text-sm text-slate-700">{message}</p>}
      </form>
    </Card>
  );
}
