-- CreateTable
CREATE TABLE "TogetherSession" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "TogetherSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TogetherSession_channelId_type_state_idx" ON "TogetherSession"("channelId", "type", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_sessionId_userId_key" ON "Vote"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TogetherSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
