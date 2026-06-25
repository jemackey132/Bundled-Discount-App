/*
  Warnings:

  - You are about to drop the column `bunde_discount_value` on the `Bundle` table. All the data in the column will be lost.
  - You are about to alter the column `bundle_sales` on the `Bundle` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - A unique constraint covering the columns `[bundle_title]` on the table `Bundle` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bundle_gid]` on the table `Bundle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bundle_discount_value` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Bundle` DROP COLUMN `bunde_discount_value`,
    ADD COLUMN `bundle_currency` VARCHAR(191) NULL,
    ADD COLUMN `bundle_discount_value` VARCHAR(191) NOT NULL,
    MODIFY `bundle_sales` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `bundle_media` TEXT NULL;

-- CreateTable
CREATE TABLE `BundleSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NOT NULL,
    `subscriptions_enabled` BOOLEAN NOT NULL DEFAULT false,
    `track_inventory` BOOLEAN NOT NULL DEFAULT false,
    `track_inventory_mode` VARCHAR(191) NOT NULL DEFAULT 'disabled',
    `button_action` VARCHAR(191) NOT NULL DEFAULT 'cart',
    `variant_selector` VARCHAR(191) NOT NULL DEFAULT 'color_swatch',
    `product_pricing` VARCHAR(191) NOT NULL DEFAULT 'final_price',
    `discount_application` VARCHAR(191) NOT NULL DEFAULT 'when_click',
    `discount_combination` VARCHAR(191) NOT NULL DEFAULT 'when_click',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BundleSettings_shop_key`(`shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Bundle_bundle_title_key` ON `Bundle`(`bundle_title`);

-- CreateIndex
CREATE UNIQUE INDEX `Bundle_bundle_gid_key` ON `Bundle`(`bundle_gid`);
