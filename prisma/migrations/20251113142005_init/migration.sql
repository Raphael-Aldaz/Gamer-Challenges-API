-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "pseudo" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "user_avatar_media_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "game" (
    "game_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "game_media_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "game_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "challenge" (
    "challenge_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "challenge_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateTable
CREATE TABLE "participation" (
    "participation_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "participation_url" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "participation_pkey" PRIMARY KEY ("participation_id")
);

-- CreateTable
CREATE TABLE "challenge_like" (
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_like_pkey" PRIMARY KEY ("user_id","challenge_id")
);

-- CreateTable
CREATE TABLE "participation_like" (
    "user_id" INTEGER NOT NULL,
    "participation_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participation_like_pkey" PRIMARY KEY ("user_id","participation_id")
);

-- CreateTable
CREATE TABLE "media" (
    "media_id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "type" (
    "type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_background_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "type_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "type_game" (
    "game_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "type_game_pkey" PRIMARY KEY ("game_id","type_id")
);

-- CreateTable
CREATE TABLE "platform" (
    "platform_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "platform_pkey" PRIMARY KEY ("platform_id")
);

-- CreateTable
CREATE TABLE "platform_game" (
    "game_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,

    CONSTRAINT "platform_game_pkey" PRIMARY KEY ("game_id","platform_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_role_name_key" ON "role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_pseudo_key" ON "user"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_user_avatar_media_id_key" ON "user"("user_avatar_media_id");

-- CreateIndex
CREATE INDEX "user_user_id_idx" ON "user"("user_id");

-- CreateIndex
CREATE INDEX "user_deleted_at_idx" ON "user"("deleted_at");

-- CreateIndex
CREATE INDEX "user_role_user_id_idx" ON "user_role"("user_id");

-- CreateIndex
CREATE INDEX "user_role_role_id_idx" ON "user_role"("role_id");

-- CreateIndex
CREATE INDEX "user_role_deleted_at_idx" ON "user_role"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_title_key" ON "game"("title");

-- CreateIndex
CREATE UNIQUE INDEX "game_game_media_id_key" ON "game"("game_media_id");

-- CreateIndex
CREATE INDEX "game_game_id_idx" ON "game"("game_id");

-- CreateIndex
CREATE INDEX "game_deleted_at_idx" ON "game"("deleted_at");

-- CreateIndex
CREATE INDEX "challenge_user_id_idx" ON "challenge"("user_id");

-- CreateIndex
CREATE INDEX "challenge_game_id_idx" ON "challenge"("game_id");

-- CreateIndex
CREATE INDEX "challenge_deleted_at_idx" ON "challenge"("deleted_at");

-- CreateIndex
CREATE INDEX "challenge_game_id_deleted_at_idx" ON "challenge"("game_id", "deleted_at");

-- CreateIndex
CREATE INDEX "participation_user_id_idx" ON "participation"("user_id");

-- CreateIndex
CREATE INDEX "participation_challenge_id_idx" ON "participation"("challenge_id");

-- CreateIndex
CREATE INDEX "participation_deleted_at_idx" ON "participation"("deleted_at");

-- CreateIndex
CREATE INDEX "participation_challenge_id_deleted_at_idx" ON "participation"("challenge_id", "deleted_at");

-- CreateIndex
CREATE INDEX "challenge_like_challenge_id_idx" ON "challenge_like"("challenge_id");

-- CreateIndex
CREATE INDEX "challenge_like_user_id_idx" ON "challenge_like"("user_id");

-- CreateIndex
CREATE INDEX "participation_like_participation_id_idx" ON "participation_like"("participation_id");

-- CreateIndex
CREATE INDEX "participation_like_user_id_idx" ON "participation_like"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_filename_key" ON "media"("filename");

-- CreateIndex
CREATE INDEX "media_deleted_at_idx" ON "media"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "type_name_key" ON "type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "type_image_background_id_key" ON "type"("image_background_id");

-- CreateIndex
CREATE INDEX "type_deleted_at_idx" ON "type"("deleted_at");

-- CreateIndex
CREATE INDEX "type_game_game_id_idx" ON "type_game"("game_id");

-- CreateIndex
CREATE INDEX "type_game_type_id_idx" ON "type_game"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_name_key" ON "platform"("name");

-- CreateIndex
CREATE INDEX "platform_deleted_at_idx" ON "platform"("deleted_at");

-- CreateIndex
CREATE INDEX "platform_game_game_id_idx" ON "platform_game"("game_id");

-- CreateIndex
CREATE INDEX "platform_game_platform_id_idx" ON "platform_game"("platform_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_expired_at_idx" ON "refresh_token"("user_id", "expired_at");

-- CreateIndex
CREATE INDEX "refresh_token_expired_at_idx" ON "refresh_token"("expired_at");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_user_avatar_media_id_fkey" FOREIGN KEY ("user_avatar_media_id") REFERENCES "media"("media_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_game_media_id_fkey" FOREIGN KEY ("game_media_id") REFERENCES "media"("media_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge" ADD CONSTRAINT "challenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge" ADD CONSTRAINT "challenge_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation" ADD CONSTRAINT "participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation" ADD CONSTRAINT "participation_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_like" ADD CONSTRAINT "challenge_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_like" ADD CONSTRAINT "challenge_like_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_like" ADD CONSTRAINT "participation_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_like" ADD CONSTRAINT "participation_like_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "participation"("participation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type" ADD CONSTRAINT "type_image_background_id_fkey" FOREIGN KEY ("image_background_id") REFERENCES "media"("media_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_game" ADD CONSTRAINT "type_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_game" ADD CONSTRAINT "type_game_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "type"("type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_game" ADD CONSTRAINT "platform_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_game" ADD CONSTRAINT "platform_game_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platform"("platform_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
