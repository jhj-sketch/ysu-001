import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { jsonError, jsonOk, normalizeBizNo } from "@/lib/utils";

export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const studentNo = searchParams.get("studentNo")?.trim();
  const bizNo = normalizeBizNo(searchParams.get("businessRegistrationNo"));

  if (!studentNo && !bizNo) {
    return jsonError("studentNo or businessRegistrationNo is required.");
  }

  const student = studentNo
    ? await prisma.student.findUnique({
        where: { studentNo },
        include: {
          department: true,
          founderCompanies: { include: { company: true } },
        },
      })
    : null;

  const company = bizNo
    ? await prisma.company.findUnique({
        where: { businessRegistrationNo: bizNo },
        include: { founderCompanies: { include: { student: true } } },
      })
    : null;

  return jsonOk({
    studentExists: Boolean(student),
    companyExists: Boolean(company),
    student,
    company,
  });
}
