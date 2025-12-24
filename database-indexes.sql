-- Critical Performance Indexes for Comet SaaS
-- Updated for current schema - Run these after initial schema setup for 5-10x query speed improvement

-- ShopBuilding indexes
CREATE INDEX IF NOT EXISTS idx_shop_building_name ON shop_buildings(name);
CREATE INDEX IF NOT EXISTS idx_shop_building_created_at ON shop_buildings("created_at");

-- ShopZone indexes
CREATE INDEX IF NOT EXISTS idx_shop_zone_building ON shop_zones("shop_building_id");

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_building ON equipment("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_zone ON equipment("preferred_zone_id");

-- Equipment Power Specs indexes
CREATE INDEX IF NOT EXISTS idx_power_specs_equipment ON equipment_power_specs("equipment_id");

-- Equipment Dust Specs indexes
CREATE INDEX IF NOT EXISTS idx_dust_specs_equipment ON equipment_dust_specs("equipment_id");

-- Equipment Air Specs indexes
CREATE INDEX IF NOT EXISTS idx_air_specs_equipment ON equipment_air_specs("equipment_id");

-- Layout Instance indexes
CREATE INDEX IF NOT EXISTS idx_layout_building ON layout_instances("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_layout_created_at ON layout_instances("created_at");

-- Equipment Layout Position indexes
CREATE INDEX IF NOT EXISTS idx_position_layout ON equipment_layout_positions("layout_id");
CREATE INDEX IF NOT EXISTS idx_position_equipment ON equipment_layout_positions("equipment_id");

-- Utility Point indexes
CREATE INDEX IF NOT EXISTS idx_utility_building ON utility_points("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_utility_type ON utility_points(type);

-- Dust Run indexes
CREATE INDEX IF NOT EXISTS idx_dust_layout ON dust_runs("layout_id");
CREATE INDEX IF NOT EXISTS idx_dust_from_equipment ON dust_runs("from_equipment_id");
CREATE INDEX IF NOT EXISTS idx_dust_to_equipment ON dust_runs("to_equipment_id");

-- Air Run indexes
CREATE INDEX IF NOT EXISTS idx_air_layout ON air_runs("layout_id");
CREATE INDEX IF NOT EXISTS idx_air_from_utility ON air_runs("from_utility_id");
CREATE INDEX IF NOT EXISTS idx_air_to_equipment ON air_runs("to_equipment_id");

-- Electrical Circuit indexes
CREATE INDEX IF NOT EXISTS idx_circuit_layout ON electrical_circuits("layout_id");
CREATE INDEX IF NOT EXISTS idx_circuit_panel ON electrical_circuits("panel_utility_id");

-- Equipment Circuit indexes
CREATE INDEX IF NOT EXISTS idx_equipment_circuit_circuit ON equipment_circuits("circuit_id");
CREATE INDEX IF NOT EXISTS idx_equipment_circuit_equipment ON equipment_circuits("equipment_id");

-- Foreign key indexes (automatically created by Prisma but ensuring they exist)
CREATE INDEX IF NOT EXISTS idx_fk_shop_zone_building ON shop_zones("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_fk_equipment_building ON equipment("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_fk_utility_building ON utility_points("shop_building_id");
CREATE INDEX IF NOT EXISTS idx_fk_layout_building ON layout_instances("shop_building_id");

-- To apply these indexes, run:
-- psql $DATABASE_URL -f database-indexes.sql
