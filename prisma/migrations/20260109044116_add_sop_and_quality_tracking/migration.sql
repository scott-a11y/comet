/*
  Warnings:

  - Made the column `has_collisions` on table `layout_instances` required. This step will fail if there are existing NULL values in that column.
  - Made the column `collision_count` on table `layout_instances` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "idx_air_runs_from_utility_id";

-- DropIndex
DROP INDEX "idx_air_runs_to_equipment_id";

-- DropIndex
DROP INDEX "idx_dust_runs_from_equipment_id";

-- DropIndex
DROP INDEX "idx_dust_runs_from_utility_id";

-- DropIndex
DROP INDEX "idx_dust_runs_to_equipment_id";

-- DropIndex
DROP INDEX "idx_dust_runs_to_utility_id";

-- DropIndex
DROP INDEX "idx_equipment_air_specs_equipment_id";

-- DropIndex
DROP INDEX "idx_equipment_circuits_circuit_id";

-- DropIndex
DROP INDEX "idx_equipment_circuits_equipment_id";

-- DropIndex
DROP INDEX "idx_equipment_dust_specs_equipment_id";

-- DropIndex
DROP INDEX "idx_equipment_layout_positions_layout_id";

-- DropIndex
DROP INDEX "idx_equipment_power_specs_equipment_id";

-- AlterTable
ALTER TABLE "EquipmentInstance" ADD COLUMN     "specs" JSONB;

-- AlterTable
ALTER TABLE "dust_runs" ADD COLUMN     "cfm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "velocity_fpm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "layout_instances" ALTER COLUMN "has_collisions" SET NOT NULL,
ALTER COLUMN "collision_count" SET NOT NULL,
ALTER COLUMN "last_collision_check" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "system_runs" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "system_type" TEXT NOT NULL,
    "from_equipment_id" INTEGER,
    "to_utility_id" INTEGER,
    "path_data" JSONB NOT NULL,
    "diameter" DOUBLE PRECISION,
    "wire_size" TEXT,
    "calculations" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_steps" (
    "id" TEXT NOT NULL,
    "sop_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "photo_url" TEXT,
    "estimated_minutes" DOUBLE PRECISION,
    "safety_notes" TEXT,

    CONSTRAINT "sop_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defect_logs" (
    "id" TEXT NOT NULL,
    "defect_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "product_line" TEXT,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMP(3),
    "reported_by" TEXT,
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defect_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_runs_layout_id_idx" ON "system_runs"("layout_id");

-- CreateIndex
CREATE INDEX "system_runs_system_type_idx" ON "system_runs"("system_type");

-- CreateIndex
CREATE INDEX "sops_category_idx" ON "sops"("category");

-- CreateIndex
CREATE INDEX "sops_status_idx" ON "sops"("status");

-- CreateIndex
CREATE INDEX "sops_created_at_idx" ON "sops"("created_at");

-- CreateIndex
CREATE INDEX "sop_steps_sop_id_idx" ON "sop_steps"("sop_id");

-- CreateIndex
CREATE UNIQUE INDEX "sop_steps_sop_id_step_number_key" ON "sop_steps"("sop_id", "step_number");

-- CreateIndex
CREATE INDEX "defect_logs_defect_type_idx" ON "defect_logs"("defect_type");

-- CreateIndex
CREATE INDEX "defect_logs_severity_idx" ON "defect_logs"("severity");

-- CreateIndex
CREATE INDEX "defect_logs_status_idx" ON "defect_logs"("status");

-- CreateIndex
CREATE INDEX "defect_logs_created_at_idx" ON "defect_logs"("created_at");

-- CreateIndex
CREATE INDEX "EquipmentInstance_layoutId_idx" ON "EquipmentInstance"("layoutId");

-- CreateIndex
CREATE INDEX "Layout_buildingId_idx" ON "Layout"("buildingId");

-- AddForeignKey
ALTER TABLE "system_runs" ADD CONSTRAINT "system_runs_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_steps" ADD CONSTRAINT "sop_steps_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_air_runs_layout_id" RENAME TO "air_runs_layout_id_idx";

-- RenameIndex
ALTER INDEX "idx_dust_runs_layout_id" RENAME TO "dust_runs_layout_id_idx";

-- RenameIndex
ALTER INDEX "idx_electrical_circuits_layout_id" RENAME TO "electrical_circuits_layout_id_idx";

-- RenameIndex
ALTER INDEX "idx_electrical_circuits_panel_utility_id" RENAME TO "electrical_circuits_panel_utility_id_idx";

-- RenameIndex
ALTER INDEX "idx_equipment_preferred_zone_id" RENAME TO "equipment_preferred_zone_id_idx";

-- RenameIndex
ALTER INDEX "idx_equipment_shop_building_id" RENAME TO "equipment_shop_building_id_idx";

-- RenameIndex
ALTER INDEX "idx_equipment_layout_positions_equipment_id" RENAME TO "equipment_layout_positions_equipment_id_idx";

-- RenameIndex
ALTER INDEX "idx_layout_collisions" RENAME TO "layout_instances_has_collisions_idx";

-- RenameIndex
ALTER INDEX "idx_layout_instances_shop_building_id" RENAME TO "layout_instances_shop_building_id_idx";

-- RenameIndex
ALTER INDEX "idx_shop_zones_shop_building_id" RENAME TO "shop_zones_shop_building_id_idx";

-- RenameIndex
ALTER INDEX "idx_utility_points_shop_building_id" RENAME TO "utility_points_shop_building_id_idx";
