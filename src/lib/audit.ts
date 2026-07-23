import { prisma } from "./prisma";

export async function writeAudit(params: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: unknown;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        detail:
          typeof params.detail === "string"
            ? params.detail
            : params.detail
              ? JSON.stringify(params.detail)
              : null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("audit write failed", e);
  }
}
