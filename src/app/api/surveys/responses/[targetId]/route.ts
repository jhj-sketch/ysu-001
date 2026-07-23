import { prisma } from "@/lib/prisma";
import { requireSession, canAccessStudent } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/utils";
import { ROLES, POST_GRAD_STATUS } from "@/lib/constants";

type Params = { params: Promise<{ targetId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireSession([
    ROLES.DEPT_STAFF,
    ROLES.CENTER_STAFF,
    ROLES.ADMIN,
  ]);
  if (error) return error;

  const { targetId } = await params;
  const body = await req.json();
  const postGraduationStatus = String(body.postGraduationStatus || "");
  const note = body.note ? String(body.note) : null;

  if (!Object.values(POST_GRAD_STATUS).includes(postGraduationStatus as never)) {
    return jsonError("유효하지 않은 상태입니다.");
  }

  const target = await prisma.surveyTarget.findUnique({
    where: { id: targetId },
    include: { student: true },
  });
  if (!target) return jsonError("대상자를 찾을 수 없습니다.", 404);
  if (!canAccessStudent(session, target.student)) return jsonError("권한이 없습니다.", 403);

  const isFounder = postGraduationStatus === POST_GRAD_STATUS.FOUNDED;

  const response = await prisma.surveyResponse.upsert({
    where: { targetId },
    update: {
      postGraduationStatus,
      isFounder,
      note,
      respondedByUserId: session.id,
    },
    create: {
      targetId,
      postGraduationStatus,
      isFounder,
      note,
      respondedByUserId: session.id,
    },
  });

  await prisma.surveyTarget.update({
    where: { id: targetId },
    data: { status: "COMPLETED" },
  });

  await writeAudit({
    userId: session.id,
    action: "SURVEY_RESPONSE",
    entityType: "SurveyTarget",
    entityId: targetId,
    detail: { postGraduationStatus },
  });

  return jsonOk({ response, needsCompany: isFounder }, "응답이 저장되었습니다.");
}
