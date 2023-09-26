/*
  Warnings:

  - Added the required column `updated_at` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Bundle` ADD COLUMN `bundle_discount_price` VARCHAR(191) NULL,
    ADD COLUMN `bundle_gid` VARCHAR(191) NULL,
    ADD COLUMN `bundle_handle` VARCHAR(191) NULL,
    ADD COLUMN `bundle_media` VARCHAR(191) NULL,
    ADD COLUMN `bundle_price` VARCHAR(191) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;
