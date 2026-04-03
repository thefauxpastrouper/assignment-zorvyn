/*
  Warnings:

  - You are about to alter the column `amount` on the `Record` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.
  - Changed the type of `type` on the `Record` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "Record" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "type",
ADD COLUMN     "type" "RecordType" NOT NULL;
