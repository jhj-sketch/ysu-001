import * as XLSX from "xlsx";

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseSpreadsheet(buffer: ArrayBuffer | Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const headers = json.length
    ? Object.keys(json[0])
    : (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] as string[]) || [];

  const rows = json.map((row) => {
    const out: Record<string, string> = {};
    for (const key of headers) {
      out[key] = String(row[key] ?? "").trim();
    }
    return out;
  });

  return { headers, rows };
}

export const FIELD_ALIASES: Record<string, string[]> = {
  studentNo: ["학번", "학생번호", "student_no", "studentNo", "StudentNo"],
  name: ["이름", "성명", "name", "Name"],
  departmentName: ["학과", "학과명", "department", "departmentName"],
  studentStatus: ["학적", "학적상태", "구분", "studentStatus"],
  companyName: ["기업명", "회사명", "상호", "companyName", "company_name"],
  businessRegistrationNo: [
    "사업자번호",
    "사업자등록번호",
    "사업자등록번호(하이픈제외)",
    "bizNo",
    "businessRegistrationNo",
  ],
  representativeName: ["대표자", "대표자명", "representativeName"],
  industry: ["업종", "industry"],
  businessType: ["업태", "종목", "businessType"],
  address: ["주소", "사업장주소", "address"],
  foundedDate: ["창업일", "개업일", "개업연월일", "foundedDate"],
  email: ["이메일", "email", "E-mail"],
  phone: ["연락처", "휴대폰", "전화", "phone"],
};

export function autoMapColumns(headers: string[]) {
  const mapping: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const found = headers.find((h) =>
      aliases.some((a) => a.toLowerCase() === h.toLowerCase() || h.includes(a)),
    );
    if (found) mapping[field] = found;
  }
  return mapping;
}

export function rowsToWorkbook(rows: Record<string, unknown>[], sheetName = "data") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
