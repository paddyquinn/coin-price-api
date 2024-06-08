/*
  Warnings:

  - A unique constraint covering the columns `[cmc_id]` on the table `Coin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cmc_id` to the `Coin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Coin" ADD COLUMN     "cmc_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Coin_cmc_id_key" ON "Coin"("cmc_id");
