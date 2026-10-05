/*
  Warnings:

  - Changed the type of `frequencyType` on the `habits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('daily', 'weekdays', 'timesPerWeek');

-- DropForeignKey
ALTER TABLE "habits" DROP CONSTRAINT "habits_categoryId_fkey";

-- AlterTable
ALTER TABLE "habits" ALTER COLUMN "categoryId" DROP NOT NULL,
DROP COLUMN "frequencyType",
ADD COLUMN     "frequencyType" "FrequencyType" NOT NULL;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
