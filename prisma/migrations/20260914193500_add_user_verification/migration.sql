-- AlterTable
ALTER TABLE `users` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verificationCode` VARCHAR(10) NULL,
    ADD COLUMN `verificationCodeExpiresAt` DATETIME(3) NULL;
