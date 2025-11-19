-- DropForeignKey
ALTER TABLE "challenge_like" DROP CONSTRAINT "challenge_like_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge_like" DROP CONSTRAINT "challenge_like_user_id_fkey";

-- DropForeignKey
ALTER TABLE "participation_like" DROP CONSTRAINT "participation_like_participation_id_fkey";

-- DropForeignKey
ALTER TABLE "participation_like" DROP CONSTRAINT "participation_like_user_id_fkey";

-- AddForeignKey
ALTER TABLE "challenge_like" ADD CONSTRAINT "challenge_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_like" ADD CONSTRAINT "challenge_like_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_like" ADD CONSTRAINT "participation_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_like" ADD CONSTRAINT "participation_like_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "participation"("participation_id") ON DELETE CASCADE ON UPDATE CASCADE;
