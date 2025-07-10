-- CreateTable
CREATE TABLE "UpdateRequestEvidence" (
    "id" TEXT NOT NULL,
    "updateRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateRequestEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateRequestEvidence_updateRequestId_idx" ON "UpdateRequestEvidence"("updateRequestId");

-- AddForeignKey
ALTER TABLE "UpdateRequestEvidence" ADD CONSTRAINT "UpdateRequestEvidence_updateRequestId_fkey" FOREIGN KEY ("updateRequestId") REFERENCES "VaspUpdateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;