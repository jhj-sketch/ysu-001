type ProgramLike = {
  id: string;
  name: string;
  description: string | null;
  targetStatuses: string;
  industryKeywords: string | null;
  applyUrl: string | null;
  applyStartDate: Date | null;
  applyEndDate: Date | null;
  isActive: boolean;
};

type StudentLike = {
  studentStatus: string;
};

type CompanyLike = {
  industry?: string | null;
  businessType?: string | null;
};

export function matchPrograms(
  programs: ProgramLike[],
  student: StudentLike,
  company?: CompanyLike | null,
  now = new Date(),
) {
  return programs.filter((p) => {
    if (!p.isActive) return false;

    const statuses = p.targetStatuses.split(",").map((s) => s.trim());
    if (!statuses.includes(student.studentStatus) && !statuses.includes("전체")) {
      return false;
    }

    if (p.applyStartDate && now < p.applyStartDate) return false;
    if (p.applyEndDate && now > p.applyEndDate) return false;

    const keywords = (p.industryKeywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (!keywords.length || keywords.includes("전체")) return true;

    const haystack = `${company?.industry ?? ""} ${company?.businessType ?? ""}`;
    return keywords.some((k) => haystack.includes(k));
  });
}
