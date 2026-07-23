export const ROLES = {
  STUDENT: "STUDENT",
  DEPT_STAFF: "DEPT_STAFF",
  CENTER_STAFF: "CENTER_STAFF",
  ADMIN: "ADMIN",
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const REVIEW_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_MORE_INFO: "NEEDS_MORE_INFO",
  PENDING: "PENDING",
} as const;

export const STUDENT_STATUS = {
  ENROLLED: "ENROLLED",
  LEAVE: "LEAVE",
  GRADUATED: "GRADUATED",
  WITHDRAWN: "WITHDRAWN",
  UNKNOWN: "UNKNOWN",
} as const;

export const POST_GRAD_STATUS = {
  EMPLOYED: "EMPLOYED",
  ADVANCED_STUDY: "ADVANCED_STUDY",
  FOUNDED: "FOUNDED",
  UNKNOWN: "UNKNOWN",
  OTHER: "OTHER",
} as const;

export const ROLE_HOME: Record<RoleCode, string> = {
  STUDENT: "/student",
  DEPT_STAFF: "/department",
  CENTER_STAFF: "/center",
  ADMIN: "/admin",
};

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: "학생",
  DEPT_STAFF: "학과 담당자",
  CENTER_STAFF: "센터 담당자",
  ADMIN: "시스템 관리자",
};

export const REVIEW_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  SUBMITTED: "제출",
  REVIEWING: "확인중",
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  NEEDS_MORE_INFO: "보완요청",
};

export const STUDENT_STATUS_LABEL: Record<string, string> = {
  ENROLLED: "재학생",
  LEAVE: "휴학생",
  GRADUATED: "졸업생",
  WITHDRAWN: "자퇴/제적",
  UNKNOWN: "미상",
};

export const POST_GRAD_LABEL: Record<string, string> = {
  EMPLOYED: "취업",
  ADVANCED_STUDY: "진학",
  FOUNDED: "창업",
  UNKNOWN: "미상",
  OTHER: "기타",
};
