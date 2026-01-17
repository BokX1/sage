/*
  Warnings:

  - You are about to drop the column `content` on the `MemoryItem` table. All the data in the column will be lost.
  - Added the required column `consentSource` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByUserId` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeId` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeType` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `MemoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemoryItem" DROP COLUMN "content",
ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "consentSource" TEXT NOT NULL,
ADD COLUMN     "createdByUserId" TEXT NOT NULL,
ADD COLUMN     "createdFromTraceId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "lastReinforcedAt" TIMESTAMP(3),
ADD COLUMN     "reinforcementCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scopeId" TEXT NOT NULL,
ADD COLUMN     "scopeType" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MemoryAudit" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "memoryItemId" TEXT,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "traceId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "MemoryAudit_pkey" PRIMARY KEY ("id")
);
