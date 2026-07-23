import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { rowsToWorkbook } from "@/lib/excel/parse";
import { jsonError } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireSession([ROLES.CENTER_STAFF, ROLES.ADMIN]);
  if (error) return error;

  const { id } = await params;
  const rows = await prisma.importRow.findMany({
    where: { importJobId: id, status: "ERROR" },
    orderBy: { rowNumber: "asc" },
  });

  if (!rows.length) return jsonError("오류 행이 없습니다.", 404);

  const exportRows = rows.map((r) => ({
    rowNumber: r.rowNumber,
    error: r.errorMessage,
    ...JSON.parse(r.rawData),
  }));

  const buffer = rowsToWorkbook(exportRows, "errors");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="import-errors-${id}.xlsx"`,
    },
  });
}
