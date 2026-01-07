-- Critical Performance Indexes for Comet SaaS
--
-- NOTE: This file is kept for convenience, but the source of truth is the
-- Prisma migration:
--   prisma/migrations/20251227160000_add_performance_indexes/migration.sql
--
-- If you prefer applying indexes manually (instead of via Prisma migrations),
-- you can run:
--   psql $DATABASE_URL -f database-indexes.sql

-- ShopBuilding
CREATE INDEX IF NOT EXISTS "idx_shop_buildings_name" ON "shop_buildings"("name");
CREATE INDEX IF NOT EXISTS "idx_shop_buildings_created_at" ON "shop_buildings"("created_at");

-- ShopZone
CREATE INDEX IF NOT EXISTS "idx_shop_zones_shop_building_id" ON "shop_zones"("shop_building_id");

-- UtilityPoint
CREATE INDEX IF NOT EXISTS "idx_utility_points_shop_building_id" ON "utility_points"("shop_building_id");
CREATE INDEX IF NOT EXISTS "idx_utility_points_type" ON "utility_points"("type");

-- Equipment
CREATE INDEX IF NOT EXISTS "idx_equipment_shop_building_id" ON "equipment"("shop_building_id");
CREATE INDEX IF NOT EXISTS "idx_equipment_name" ON "equipment"("name");
CREATE INDEX IF NOT EXISTS "idx_equipment_category" ON "equipment"("category");
CREATE INDEX IF NOT EXISTS "idx_equipment_preferred_zone_id" ON "equipment"("preferred_zone_id");

-- Equipment specs tables
CREATE INDEX IF NOT EXISTS "idx_equipment_power_specs_equipment_id" ON "equipment_power_specs"("equipment_id");
CREATE INDEX IF NOT EXISTS "idx_equipment_dust_specs_equipment_id" ON "equipment_dust_specs"("equipment_id");
CREATE INDEX IF NOT EXISTS "idx_equipment_air_specs_equipment_id" ON "equipment_air_specs"("equipment_id");

-- LayoutInstance
CREATE INDEX IF NOT EXISTS "idx_layout_instances_shop_building_id" ON "layout_instances"("shop_building_id");
CREATE INDEX IF NOT EXISTS "idx_layout_instances_created_at" ON "layout_instances"("created_at");

-- EquipmentLayoutPosition
CREATE INDEX IF NOT EXISTS "idx_equipment_layout_positions_layout_id" ON "equipment_layout_positions"("layout_id");
CREATE INDEX IF NOT EXISTS "idx_equipment_layout_positions_equipment_id" ON "equipment_layout_positions"("equipment_id");

-- DustRun
CREATE INDEX IF NOT EXISTS "idx_dust_runs_layout_id" ON "dust_runs"("layout_id");
CREATE INDEX IF NOT EXISTS "idx_dust_runs_from_equipment_id" ON "dust_runs"("from_equipment_id");
CREATE INDEX IF NOT EXISTS "idx_dust_runs_to_equipment_id" ON "dust_runs"("to_equipment_id");
CREATE INDEX IF NOT EXISTS "idx_dust_runs_from_utility_id" ON "dust_runs"("from_utility_id");
CREATE INDEX IF NOT EXISTS "idx_dust_runs_to_utility_id" ON "dust_runs"("to_utility_id");

-- AirRun
CREATE INDEX IF NOT EXISTS "idx_air_runs_layout_id" ON "air_runs"("layout_id");
CREATE INDEX IF NOT EXISTS "idx_air_runs_from_utility_id" ON "air_runs"("from_utility_id");
CREATE INDEX IF NOT EXISTS "idx_air_runs_to_equipment_id" ON "air_runs"("to_equipment_id");

-- ElectricalCircuit
CREATE INDEX IF NOT EXISTS "idx_electrical_circuits_layout_id" ON "electrical_circuits"("layout_id");
CREATE INDEX IF NOT EXISTS "idx_electrical_circuits_panel_utility_id" ON "electrical_circuits"("panel_utility_id");

-- EquipmentCircuit
CREATE INDEX IF NOT EXISTS "idx_equipment_circuits_circuit_id" ON "equipment_circuits"("circuit_id");
CREATE INDEX IF NOT EXISTS "idx_equipment_circuits_equipment_id" ON "equipment_circuits"("equipment_id");