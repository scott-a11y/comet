-- Add entry points (doors, loading docks) to buildings
CREATE TABLE IF NOT EXISTS entry_points (
  id SERIAL PRIMARY KEY,
  shop_building_id INTEGER NOT NULL REFERENCES shop_buildings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'door', 'loading_dock', 'overhead_door', 'emergency_exit'
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  width_ft FLOAT DEFAULT 3, -- Standard door is 3ft, loading dock might be 10ft
  direction VARCHAR(50), -- 'north', 'south', 'east', 'west' - which wall it's on
  is_primary BOOLEAN DEFAULT false, -- Primary entrance for material flow
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entry_points_building ON entry_points(shop_building_id);
CREATE INDEX idx_entry_points_type ON entry_points(type);

-- Add utility connection points (electrical panels, dust collection mains, air compressor)
-- Note: This extends the existing utility_points table with additional metadata
-- We'll add a column to track if it's a main connection point
ALTER TABLE utility_points ADD COLUMN IF NOT EXISTS is_main_connection BOOLEAN DEFAULT false;
ALTER TABLE utility_points ADD COLUMN IF NOT EXISTS capacity_rating VARCHAR(100);
ALTER TABLE utility_points ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add material flow paths to layouts
CREATE TABLE IF NOT EXISTS material_flow_paths (
  id SERIAL PRIMARY KEY,
  layout_id INTEGER NOT NULL REFERENCES layout_instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  from_entry_point_id INTEGER REFERENCES entry_points(id),
  to_entry_point_id INTEGER REFERENCES entry_points(id),
  path_type VARCHAR(50) NOT NULL, -- 'receiving', 'processing', 'shipping', 'waste'
  path_data JSONB NOT NULL, -- Array of {x, y} points for the path
  color VARCHAR(20) DEFAULT '#3b82f6',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_flow_layout ON material_flow_paths(layout_id);
CREATE INDEX idx_material_flow_type ON material_flow_paths(path_type);

COMMENT ON TABLE entry_points IS 'Doors, loading docks, and entry/exit points for buildings';
COMMENT ON TABLE material_flow_paths IS 'Material flow paths showing receiving, processing, and shipping routes';
