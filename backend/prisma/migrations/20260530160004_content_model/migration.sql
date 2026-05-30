-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('sermon', 'podcast', 'teaching', 'worship', 'testimony', 'other');

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT,
    "series" TEXT,
    "description" TEXT,
    "category" "ContentCategory" NOT NULL DEFAULT 'sermon',
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contents_category_idx" ON "contents"("category");

-- CreateIndex
CREATE INDEX "contents_publishAt_idx" ON "contents"("publishAt");
