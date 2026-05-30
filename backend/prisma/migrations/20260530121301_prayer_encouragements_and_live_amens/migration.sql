-- CreateTable
CREATE TABLE "prayer_encouragements" (
    "id" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_encouragements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_encouragements_prayerId_idx" ON "prayer_encouragements"("prayerId");

-- AddForeignKey
ALTER TABLE "prayer_encouragements" ADD CONSTRAINT "prayer_encouragements_prayerId_fkey" FOREIGN KEY ("prayerId") REFERENCES "prayers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_encouragements" ADD CONSTRAINT "prayer_encouragements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
