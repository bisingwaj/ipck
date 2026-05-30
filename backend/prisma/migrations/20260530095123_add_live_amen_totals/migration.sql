-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "amenCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "amenCount" INTEGER NOT NULL DEFAULT 0;
