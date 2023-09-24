-- CreateTable
CREATE TABLE `Bundle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NOT NULL,
    `bundle_title` VARCHAR(191) NOT NULL,
    `bundle_type` VARCHAR(191) NOT NULL,
    `bundle_name` VARCHAR(191) NOT NULL,
    `bundle_image` VARCHAR(191) NOT NULL,
    `bundle_discount` BOOLEAN NOT NULL DEFAULT true,
    `bundle_discount_type` VARCHAR(191) NOT NULL,
    `bunde_discount_value` VARCHAR(191) NOT NULL,
    `bundle_status` BOOLEAN NOT NULL DEFAULT true,
    `bundle_items` JSON NOT NULL,
    `bundle_time_status` BOOLEAN NOT NULL DEFAULT false,
    `bundle_start_time` VARCHAR(191) NOT NULL,
    `bundle_start_date` VARCHAR(191) NOT NULL,
    `bundle_end_status` BOOLEAN NOT NULL DEFAULT false,
    `bundle_end_time` VARCHAR(191) NOT NULL,
    `bundle_end_date` VARCHAR(191) NOT NULL,
    `bundle_views` INTEGER NOT NULL DEFAULT 0,
    `bundle_clicks` INTEGER NOT NULL DEFAULT 0,
    `bundle_orders` INTEGER NOT NULL DEFAULT 0,
    `bundle_sales` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
