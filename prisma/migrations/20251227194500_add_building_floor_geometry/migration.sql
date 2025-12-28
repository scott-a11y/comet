-- Allow creating buildings with either explicit dimensions or drawn floor geometry.
-- Dimensions are made nullable to support geometry-only buildings.

ALTER TABLE "shop_buildings"
  ALTER COLUMN "width_ft" DROP NOT NULL,
  ALTER COLUMN "depth_ft" DROP NOT NULL;

-- Store manual floor geometry & calibration
ALTER TABLE "shop_buildings"
  ADD COLUMN "floor_geometry" JSONB,
  ADD COLUMN "floor_scale_ft_per_unit" DOUBLE PRECISION;
