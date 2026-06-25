-- AlterTable
ALTER TABLE `BundleEvent`
  ADD COLUMN `offer_type` VARCHAR(191) NULL,
  ADD COLUMN `offer_id` INT NULL;

-- CreateIndex
CREATE INDEX `BundleEvent_shop_offer_type_offer_id_idx` ON `BundleEvent`(`shop`, `offer_type`, `offer_id`);
