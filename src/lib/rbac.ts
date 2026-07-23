import { ROLES, type RoleCode } from "./constants";
import type { SessionUser } from "./auth";
import { getSession } from "./auth";
import { jsonError } from "./utils";

export function hasRole(user: SessionUser, roles: RoleCode[]) {
  return roles.includes(user.roleCode);
}

export function isCenterOrAdmin(user: SessionUser) {
  return hasRole(user, [ROLES.CENTER_STAFF, ROLES.ADMIN]);
}

export function canAccessDepartment(user: SessionUser, departmentId: string) {
  if (isCenterOrAdmin(user)) return true;
  if (user.roleCode === ROLES.DEPT_STAFF) return user.departmentId === departmentId;
  return false;
}

export function canAccessStudent(user: SessionUser, student: { id: string; departmentId: string }) {
  if (isCenterOrAdmin(user)) return true;
  if (user.roleCode === ROLES.DEPT_STAFF) return user.departmentId === student.departmentId;
  if (user.roleCode === ROLES.STUDENT) return user.studentId === student.id;
  return false;
}

export async function requireSession(
  roles?: RoleCode[],
): Promise<{ session: SessionUser; error: null } | { session: null; error: Response }> {
  const session = await getSession();
  if (!session) {
    return { session: null, error: jsonError("로그인이 필요합니다.", 401) };
  }
  if (roles && !hasRole(session, roles)) {
    return { session: null, error: jsonError("권한이 없습니다.", 403) };
  }
  return { session, error: null };
}
