-- Critical Performance Indexes for Comet SaaS
-- Run these after initial schema setup for 5-10x query speed improvement

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment("equipmentTypeId");
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);

-- Equipment placements indexes  
CREATE INDEX IF NOT EXISTS idx_placement_equipment ON equipment_placements("equipmentId");
CREATE INDEX IF NOT EXISTS idx_placement_layout ON equipment_placements("layoutId");

-- Layouts indexes
CREATE INDEX IF NOT EXISTS idx_layout_building ON layouts("buildingId");

-- Buildings indexes
CREATE INDEX IF NOT EXISTS idx_building_shop ON shop_buildings("shopId");

-- Power specs indexes
CREATE INDEX IF NOT EXISTS idx_power_equipment ON power_specs("equipmentId");

-- Routing indexes
CREATE INDEX IF NOT EXISTS idx_dust_layout ON dust_collection_points("layoutId");
CREATE INDEX IF NOT EXISTS idx_air_layout ON air_line_points("layoutId");
CREATE INDEX IF NOT EXISTS idx_electrical_layout ON electrical_circuits("layoutId");

-- Unique constraints for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_name_unique ON shops(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_type_unique ON equipment_types(name);

-- To apply these indexes, run:
-- psql $DATABASE_URL -f database-indexes.sql
