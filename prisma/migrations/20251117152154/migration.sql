/*
  Warnings:

  - You are about to drop the `type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `type_game` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "type" DROP CONSTRAINT "type_image_background_id_fkey";

-- DropForeignKey
ALTER TABLE "type_game" DROP CONSTRAINT "type_game_game_id_fkey";

-- DropForeignKey
ALTER TABLE "type_game" DROP CONSTRAINT "type_game_genre_id_fkey";

-- DropTable
DROP TABLE "type";

-- DropTable
DROP TABLE "type_game";

-- CreateTable
CREATE TABLE "genre" (
    "genre_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_background_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "genre_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "genre_game" (
    "game_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genre_game_pkey" PRIMARY KEY ("game_id","genre_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genre_image_background_id_key" ON "genre"("image_background_id");

-- CreateIndex
CREATE INDEX "genre_deleted_at_idx" ON "genre"("deleted_at");

-- CreateIndex
CREATE INDEX "genre_game_game_id_idx" ON "genre_game"("game_id");

-- CreateIndex
CREATE INDEX "genre_game_genre_id_idx" ON "genre_game"("genre_id");

-- AddForeignKey
ALTER TABLE "genre" ADD CONSTRAINT "genre_image_background_id_fkey" FOREIGN KEY ("image_background_id") REFERENCES "media"("media_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_game" ADD CONSTRAINT "genre_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_game" ADD CONSTRAINT "genre_game_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre"("genre_id") ON DELETE CASCADE ON UPDATE CASCADE;
