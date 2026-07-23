-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT,
    "student_id" TEXT,
    "program_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "uploaded_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "attachments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_attachments" ("category", "company_id", "created_at", "file_name", "file_path", "file_size", "id", "mime_type", "student_id", "uploaded_by_id") SELECT "category", "company_id", "created_at", "file_name", "file_path", "file_size", "id", "mime_type", "student_id", "uploaded_by_id" FROM "attachments";
DROP TABLE "attachments";
ALTER TABLE "new_attachments" RENAME TO "attachments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
