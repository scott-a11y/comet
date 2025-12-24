-- AlterTable
ALTER TABLE "shop_buildings" ADD COLUMN     "extracted_data" JSONB,
ADD COLUMN     "pdf_url" TEXT;

-- CreateIndex
CREATE INDEX "equipment_name_idx" ON "equipment"("name");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "layout_instances_created_at_idx" ON "layout_instances"("created_at");

-- CreateIndex
CREATE INDEX "shop_buildings_name_idx" ON "shop_buildings"("name");

-- CreateIndex
CREATE INDEX "shop_buildings_created_at_idx" ON "shop_buildings"("created_at");

-- CreateIndex
CREATE INDEX "utility_points_type_idx" ON "utility_points"("type");
