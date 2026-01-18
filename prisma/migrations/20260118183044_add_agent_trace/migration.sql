/*
  Warnings:

  - You are about to drop the column `expertOutputs` on the `AgentTrace` table. All the data in the column will be lost.
  - You are about to drop the column `governorDecision` on the `AgentTrace` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `AgentTrace` table. All the data in the column will be lost.
  - You are about to drop the column `routerDecision` on the `AgentTrace` table. All the data in the column will be lost.
  - You are about to drop the column `toolCallResults` on the `AgentTrace` table. All the data in the column will be lost.
  - You are about to drop the column `traceId` on the `AgentTrace` table. All the data in the column will be lost.
  - The primary key for the `UserProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the `Artifact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemoryAudit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemoryItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PendingAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StyleAudit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StyleItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TogetherSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UndoReceipt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expertsJson` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `governorJson` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `replyText` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routeKind` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routerJson` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `AgentTrace` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UndoReceipt" DROP CONSTRAINT "UndoReceipt_actionId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_sessionId_fkey";

-- DropIndex
DROP INDEX "AgentTrace_traceId_key";

-- DropIndex
DROP INDEX "UserProfile_userId_key";

-- AlterTable
ALTER TABLE "AgentTrace" DROP COLUMN "expertOutputs",
DROP COLUMN "governorDecision",
DROP COLUMN "messageId",
DROP COLUMN "routerDecision",
DROP COLUMN "toolCallResults",
DROP COLUMN "traceId",
ADD COLUMN     "expertsJson" JSONB NOT NULL,
ADD COLUMN     "governorJson" JSONB NOT NULL,
ADD COLUMN     "guildId" TEXT,
ADD COLUMN     "replyText" TEXT NOT NULL,
ADD COLUMN     "routeKind" TEXT NOT NULL,
ADD COLUMN     "routerJson" JSONB NOT NULL,
ADD COLUMN     "tokenJson" JSONB,
ADD COLUMN     "toolJson" JSONB,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_pkey",
DROP COLUMN "id",
ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId");

-- DropTable
DROP TABLE "Artifact";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "MemoryAudit";

-- DropTable
DROP TABLE "MemoryItem";

-- DropTable
DROP TABLE "PendingAction";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "StyleAudit";

-- DropTable
DROP TABLE "StyleItem";

-- DropTable
DROP TABLE "TogetherSession";

-- DropTable
DROP TABLE "UndoReceipt";

-- DropTable
DROP TABLE "UserSettings";

-- DropTable
DROP TABLE "Vote";

-- DropTable
DROP TABLE "WeProfile";

-- CreateTable
CREATE TABLE "ChannelSummary" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "summaryText" TEXT NOT NULL,
    "topicsJson" JSONB,
    "threadsJson" JSONB,
    "unresolvedJson" JSONB,
    "glossaryJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipEdge" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userA" TEXT NOT NULL,
    "userB" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "featuresJson" JSONB NOT NULL,
    "manualOverride" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "paramsHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelSummary_guildId_channelId_updatedAt_idx" ON "ChannelSummary"("guildId", "channelId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelSummary_guildId_channelId_kind_key" ON "ChannelSummary"("guildId", "channelId", "kind");

-- CreateIndex
CREATE INDEX "RelationshipEdge_guildId_updatedAt_idx" ON "RelationshipEdge"("guildId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipEdge_guildId_userA_userB_key" ON "RelationshipEdge"("guildId", "userA", "userB");

-- CreateIndex
CREATE INDEX "AdminAudit_guildId_createdAt_idx" ON "AdminAudit"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTrace_guildId_createdAt_idx" ON "AgentTrace"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTrace_channelId_createdAt_idx" ON "AgentTrace"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTrace_userId_createdAt_idx" ON "AgentTrace"("userId", "createdAt");
