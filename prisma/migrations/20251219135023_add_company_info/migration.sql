-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClockIn_userId_timestamp_idx" ON "ClockIn"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ClockIn_timestamp_idx" ON "ClockIn"("timestamp");
