/*
  Warnings:

  - You are about to drop the column `governorJson` on the `AgentTrace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AgentTrace" DROP COLUMN "governorJson";

-- AlterTable
ALTER TABLE "ChannelSummary" ADD COLUMN     "actionItemsJson" JSONB,
ADD COLUMN     "decisionsJson" JSONB,
ADD COLUMN     "sentiment" TEXT;
