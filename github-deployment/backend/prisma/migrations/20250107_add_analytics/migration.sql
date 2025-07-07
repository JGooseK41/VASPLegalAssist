-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" TEXT NOT NULL,
    "anonymizedIp" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorSession_createdAt_idx" ON "VisitorSession"("createdAt");
CREATE INDEX "VisitorSession_country_idx" ON "VisitorSession"("country");
CREATE INDEX "VisitorSession_countryCode_idx" ON "VisitorSession"("countryCode");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");
CREATE INDEX "PageView_path_idx" ON "PageView"("path");
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;