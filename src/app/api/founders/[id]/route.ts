import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent, isCenterOrAdmin } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { matchPrograms } from "@/lib/recommend";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const founder = await prisma.founderCompany.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          department: true,
          recommendations: { include: { program: true }, orderBy: { guidedAt: "desc" } },
          participations: { include: { program: true }, orderBy: { updatedAt: "desc" } },
          consultationNotes: {
            include: { author: true },
            orderBy: { createdAt: "desc" },
          },
          submissions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
      company: { include: { attachments: true, metrics: true } },
    },
  });

  if (!founder) return jsonError("창업자를 찾을 수 없습니다.", 404);
  if (!canAccessStudent(session, founder.student)) {
    return jsonError("권한이 없습니다.", 403);
  }

  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const recommended = matchPrograms(programs, founder.student, founder.company);

  return jsonOk({ ...founder, suggestedPrograms: recommended });
}

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;
  if (!isCenterOrAdmin(session)) return jsonError("권한이 없습니다.", 403);

  const { id } = await params;
  const body = await req.json();
  const reviewStatus = String(body.reviewStatus || "");
  const reviewNote = body.reviewNote ? String(body.reviewNote) : null;

  const allowed = ["REVIEWING", "APPROVED", "REJECTED", "NEEDS_MORE_INFO"];
  if (!allowed.includes(reviewStatus)) {
    return jsonError("유효하지 않은 검토 상태입니다.");
  }

  const founder = await prisma.founderCompany.findUnique({ where: { id } });
  if (!founder) return jsonError("창업자를 찾을 수 없습니다.", 404);

  const updated = await prisma.$transaction(async (tx) => {
    const relation = await tx.founderCompany.update({
      where: { id },
      data: {
        verificationStatus: reviewStatus,
        officialStatIncluded: reviewStatus === "APPROVED",
        pipelineStatus: reviewStatus === "APPROVED" ? "INFO_CHECKING" : founder.pipelineStatus,
      },
      include: { student: true, company: true },
    });

    await tx.submission.updateMany({
      where: { studentId: founder.studentId, companyId: founder.companyId },
      data: {
        reviewStatus,
        reviewNote,
        reviewedByUserId: session.id,
        reviewedAt: new Date(),
      },
    });

    if (reviewStatus === "APPROVED") {
      await tx.company.update({
        where: { id: founder.companyId },
        data: { lastVerifiedAt: new Date() },
      });
    }

    return relation;
  });

  await writeAudit({
    userId: session.id,
    action: "FOUNDER_REVIEW",
    entityType: "FounderCompany",
    entityId: id,
    detail: { reviewStatus, reviewNote },
  });

  return jsonOk(updated, "검토 상태가 변경되었습니다.");
}
