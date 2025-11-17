/*
  Warnings:

  - You are about to drop the column `description` on the `game` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `game` table. All the data in the column will be lost.
  - The primary key for the `type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type_id` on the `type` table. All the data in the column will be lost.
  - The primary key for the `type_game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type_id` on the `type_game` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `metacritic` to the `game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `released_date` to the `game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre_id` to the `type_game` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "type_game" DROP CONSTRAINT "type_game_type_id_fkey";

-- DropIndex
DROP INDEX "game_title_key";

-- DropIndex
DROP INDEX "type_game_type_id_idx";

-- AlterTable
ALTER TABLE "game" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "metacritic" INTEGER NOT NULL,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "released_date" DATE NOT NULL;

-- AlterTable
ALTER TABLE "type" DROP CONSTRAINT "type_pkey",
DROP COLUMN "type_id",
ADD COLUMN     "genre_id" SERIAL NOT NULL,
ADD CONSTRAINT "type_pkey" PRIMARY KEY ("genre_id");

-- AlterTable
ALTER TABLE "type_game" DROP CONSTRAINT "type_game_pkey",
DROP COLUMN "type_id",
ADD COLUMN     "genre_id" INTEGER NOT NULL,
ADD CONSTRAINT "type_game_pkey" PRIMARY KEY ("game_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_name_key" ON "game"("name");

-- CreateIndex
CREATE INDEX "type_game_genre_id_idx" ON "type_game"("genre_id");

-- AddForeignKey
ALTER TABLE "type_game" ADD CONSTRAINT "type_game_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "type"("genre_id") ON DELETE CASCADE ON UPDATE CASCADE;
