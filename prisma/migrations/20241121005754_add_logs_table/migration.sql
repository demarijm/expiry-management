-- CreateTable
CREATE TABLE "Logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "occured_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Logs_shop_key" ON "Logs"("shop");
