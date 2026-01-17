-- CreateTable
CREATE TABLE "AgentTrace" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "routerDecision" TEXT NOT NULL,
    "expertOutputs" TEXT NOT NULL,
    "governorDecision" TEXT NOT NULL,
    "toolCallResults" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentTrace_traceId_key" ON "AgentTrace"("traceId");
