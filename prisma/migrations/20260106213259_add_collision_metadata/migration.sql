-- Add collision metadata to LayoutInstance
ALTER TABLE "layout_instances" 
ADD COLUMN "has_collisions" BOOLEAN DEFAULT false,
ADD COLUMN "collision_count" INTEGER DEFAULT 0,
ADD COLUMN "collision_data" JSONB,
ADD COLUMN "last_collision_check" TIMESTAMP;

-- Create index for collision queries
CREATE INDEX "idx_layout_collisions" ON "layout_instances"("has_collisions");

-- Add comment
COMMENT ON COLUMN "layout_instances"."collision_data" IS 
'JSON array of collision pairs: [{"eq1": id, "eq2": id, "overlap": area}]';
