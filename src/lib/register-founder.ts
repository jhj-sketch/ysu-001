import { prisma } from "@/lib/prisma";
import { calcCompletenessScore } from "@/lib/completeness";
import { normalizeBizNo } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export type RegisterFounderInput = {
  studentNo: string;
  name: string;
  departmentId: string;
  studentStatus: string;
  email?: string;
  phone?: string;
  companyName: string;
  businessRegistrationNo?: string;
  representativeName?: string;
  industry?: string;
  businessType?: string;
  address?: string;
  foundedDate?: string;
  revenue?: number | null;
  capital?: number | null;
  employeeCount?: number | null;
  founderRole?: string;
  reviewStatus?: "DRAFT" | "SUBMITTED";
  consentPrivacy?: boolean;
  channel?: string;
};

export async function registerFounder(user: SessionUser, input: RegisterFounderInput) {
  const bizNo = normalizeBizNo(input.businessRegistrationNo);
  const reviewStatus = input.reviewStatus || "SUBMITTED";

  const companyData = {
    companyName: input.companyName,
    businessRegistrationNo: bizNo,
    representativeName: input.representativeName || input.name,
    industry: input.industry,
    businessType: input.businessType,
    address: input.address,
    foundedDate: input.foundedDate ? new Date(input.foundedDate) : null,
    revenue: input.revenue ?? null,
    capital: input.capital ?? null,
    employeeCount: input.employeeCount ?? null,
  };

  const completenessScore = calcCompletenessScore(companyData);

  return prisma.$transaction(async (tx) => {
    let student = await tx.student.findUnique({ where: { studentNo: input.studentNo } });
    if (!student) {
      student = await tx.student.create({
        data: {
          studentNo: input.studentNo,
          name: input.name,
          departmentId: input.departmentId,
          studentStatus: input.studentStatus,
          email: input.email,
          phone: input.phone,
          dataSource:
            input.channel ||
            (user.roleCode === "STUDENT"
              ? "SELF_REPORT"
              : user.roleCode === "DEPT_STAFF"
                ? "DEPARTMENT_INPUT"
                : "CENTER_INPUT"),
        },
      });
    } else {
      student = await tx.student.update({
        where: { id: student.id },
        data: {
          name: input.name,
          departmentId: input.departmentId,
          studentStatus: input.studentStatus,
          email: input.email,
          phone: input.phone,
        },
      });
    }

    let company =
      bizNo
        ? await tx.company.findUnique({ where: { businessRegistrationNo: bizNo } })
        : null;

    if (company) {
      company = await tx.company.update({
        where: { id: company.id },
        data: { ...companyData, completenessScore },
      });
    } else {
      company = await tx.company.create({
        data: { ...companyData, completenessScore },
      });
    }

    const existingRelation = await tx.founderCompany.findUnique({
      where: {
        studentId_companyId: { studentId: student.id, companyId: company.id },
      },
    });

    const relation = existingRelation
      ? await tx.founderCompany.update({
          where: { id: existingRelation.id },
          data: {
            founderRole: input.founderRole || "CEO",
            verificationStatus: reviewStatus === "DRAFT" ? "DRAFT" : "SUBMITTED",
          },
        })
      : await tx.founderCompany.create({
          data: {
            studentId: student.id,
            companyId: company.id,
            founderRole: input.founderRole || "CEO",
            verificationStatus: reviewStatus === "DRAFT" ? "DRAFT" : "SUBMITTED",
            registeredByUserId: user.id,
          },
        });

    const channel =
      input.channel ||
      (user.roleCode === "STUDENT"
        ? "SELF_REPORT"
        : user.roleCode === "DEPT_STAFF"
          ? "DEPARTMENT_INPUT"
          : "CENTER_INPUT");

    const submission = await tx.submission.create({
      data: {
        studentId: student.id,
        companyId: company.id,
        channel,
        reviewStatus,
        createdByUserId: user.id,
        submittedAt: reviewStatus === "SUBMITTED" ? new Date() : null,
      },
    });

    if (input.consentPrivacy) {
      await tx.consent.create({
        data: {
          studentId: student.id,
          userId: user.id,
          consentType: "PRIVACY",
          agreed: true,
        },
      });
    }

    return { student, company, relation, submission };
  });
}
