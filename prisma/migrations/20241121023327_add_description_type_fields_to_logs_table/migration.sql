/*
  Warnings:

  - Added the required column `description` to the `Logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Logs` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Logs" ("action", "id", "occured_at", "shop") SELECT "action", "id", "occured_at", "shop" FROM "Logs";
DROP TABLE "Logs";
ALTER TABLE "new_Logs" RENAME TO "Logs";
CREATE UNIQUE INDEX "Logs_shop_key" ON "Logs"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
