type CompanyLike = {
  companyName?: string | null;
  businessRegistrationNo?: string | null;
  representativeName?: string | null;
  industry?: string | null;
  businessType?: string | null;
  address?: string | null;
  foundedDate?: Date | string | null;
  revenue?: number | null;
  capital?: number | null;
  employeeCount?: number | null;
  homepageUrl?: string | null;
};

const WEIGHTS: { key: keyof CompanyLike; weight: number }[] = [
  { key: "companyName", weight: 15 },
  { key: "businessRegistrationNo", weight: 15 },
  { key: "representativeName", weight: 10 },
  { key: "industry", weight: 10 },
  { key: "businessType", weight: 5 },
  { key: "address", weight: 10 },
  { key: "foundedDate", weight: 10 },
  { key: "revenue", weight: 10 },
  { key: "capital", weight: 5 },
  { key: "employeeCount", weight: 5 },
  { key: "homepageUrl", weight: 5 },
];

export function calcCompletenessScore(company: CompanyLike): number {
  let score = 0;
  for (const { key, weight } of WEIGHTS) {
    const value = company[key];
    if (value !== null && value !== undefined && value !== "") {
      score += weight;
    }
  }
  return Math.min(100, score);
}
