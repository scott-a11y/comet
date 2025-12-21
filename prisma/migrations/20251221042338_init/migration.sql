-- CreateTable
CREATE TABLE "shop_buildings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "width_ft" DOUBLE PRECISION NOT NULL,
    "depth_ft" DOUBLE PRECISION NOT NULL,
    "ceiling_height_ft" DOUBLE PRECISION,
    "has_mezzanine" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_zones" (
    "id" SERIAL NOT NULL,
    "shop_building_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "zone_type" TEXT NOT NULL,

    CONSTRAINT "shop_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_points" (
    "id" SERIAL NOT NULL,
    "shop_building_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "voltage" DOUBLE PRECISION,
    "phase" INTEGER,
    "amps" DOUBLE PRECISION,
    "kva" DOUBLE PRECISION,
    "is_main_service" BOOLEAN NOT NULL DEFAULT false,
    "is_outdoor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "utility_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "shop_building_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "width_ft" DOUBLE PRECISION NOT NULL,
    "depth_ft" DOUBLE PRECISION NOT NULL,
    "orientation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requires_dust" BOOLEAN NOT NULL DEFAULT false,
    "requires_air" BOOLEAN NOT NULL DEFAULT false,
    "requires_high_voltage" BOOLEAN NOT NULL DEFAULT false,
    "preferred_zone_id" INTEGER,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_power_specs" (
    "equipment_id" INTEGER NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "phase" INTEGER NOT NULL,
    "amps" DOUBLE PRECISION NOT NULL,
    "power_kw" DOUBLE PRECISION,
    "circuit_type" TEXT NOT NULL DEFAULT 'standard',

    CONSTRAINT "equipment_power_specs_pkey" PRIMARY KEY ("equipment_id")
);

-- CreateTable
CREATE TABLE "equipment_dust_specs" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "num_ports" INTEGER NOT NULL DEFAULT 1,
    "port_diameter_in" DOUBLE PRECISION NOT NULL,
    "cfm_requirement" DOUBLE PRECISION,

    CONSTRAINT "equipment_dust_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_air_specs" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "pressure_bar" DOUBLE PRECISION NOT NULL,
    "flow_scfm" DOUBLE PRECISION,

    CONSTRAINT "equipment_air_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_instances" (
    "id" SERIAL NOT NULL,
    "shop_building_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layout_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_layout_positions" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "orientation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "equipment_layout_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dust_runs" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "from_equipment_id" INTEGER,
    "to_equipment_id" INTEGER,
    "from_utility_id" INTEGER,
    "to_utility_id" INTEGER,
    "diameter_in" DOUBLE PRECISION NOT NULL,
    "length_ft" DOUBLE PRECISION NOT NULL,
    "static_pressure_loss_in_wg" DOUBLE PRECISION,

    CONSTRAINT "dust_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "air_runs" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "from_utility_id" INTEGER NOT NULL,
    "to_equipment_id" INTEGER,
    "pipe_diameter_in" DOUBLE PRECISION NOT NULL,
    "length_ft" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "air_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electrical_circuits" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "panel_utility_id" INTEGER NOT NULL,
    "circuit_number" TEXT NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "phase" INTEGER NOT NULL,
    "breaker_amps" DOUBLE PRECISION NOT NULL,
    "wire_gauge" TEXT,
    "notes" TEXT,

    CONSTRAINT "electrical_circuits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_circuits" (
    "id" SERIAL NOT NULL,
    "circuit_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "distance_ft" DOUBLE PRECISION,

    CONSTRAINT "equipment_circuits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_dust_specs_equipment_id_key" ON "equipment_dust_specs"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_air_specs_equipment_id_key" ON "equipment_air_specs"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_layout_positions_layout_id_equipment_id_key" ON "equipment_layout_positions"("layout_id", "equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_circuits_circuit_id_equipment_id_key" ON "equipment_circuits"("circuit_id", "equipment_id");

-- AddForeignKey
ALTER TABLE "shop_zones" ADD CONSTRAINT "shop_zones_shop_building_id_fkey" FOREIGN KEY ("shop_building_id") REFERENCES "shop_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_points" ADD CONSTRAINT "utility_points_shop_building_id_fkey" FOREIGN KEY ("shop_building_id") REFERENCES "shop_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_shop_building_id_fkey" FOREIGN KEY ("shop_building_id") REFERENCES "shop_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_preferred_zone_id_fkey" FOREIGN KEY ("preferred_zone_id") REFERENCES "shop_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_power_specs" ADD CONSTRAINT "equipment_power_specs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_dust_specs" ADD CONSTRAINT "equipment_dust_specs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_air_specs" ADD CONSTRAINT "equipment_air_specs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_instances" ADD CONSTRAINT "layout_instances_shop_building_id_fkey" FOREIGN KEY ("shop_building_id") REFERENCES "shop_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_layout_positions" ADD CONSTRAINT "equipment_layout_positions_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_layout_positions" ADD CONSTRAINT "equipment_layout_positions_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dust_runs" ADD CONSTRAINT "dust_runs_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dust_runs" ADD CONSTRAINT "dust_runs_from_equipment_id_fkey" FOREIGN KEY ("from_equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dust_runs" ADD CONSTRAINT "dust_runs_to_equipment_id_fkey" FOREIGN KEY ("to_equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dust_runs" ADD CONSTRAINT "dust_runs_from_utility_id_fkey" FOREIGN KEY ("from_utility_id") REFERENCES "utility_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dust_runs" ADD CONSTRAINT "dust_runs_to_utility_id_fkey" FOREIGN KEY ("to_utility_id") REFERENCES "utility_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_runs" ADD CONSTRAINT "air_runs_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_runs" ADD CONSTRAINT "air_runs_from_utility_id_fkey" FOREIGN KEY ("from_utility_id") REFERENCES "utility_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "air_runs" ADD CONSTRAINT "air_runs_to_equipment_id_fkey" FOREIGN KEY ("to_equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electrical_circuits" ADD CONSTRAINT "electrical_circuits_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electrical_circuits" ADD CONSTRAINT "electrical_circuits_panel_utility_id_fkey" FOREIGN KEY ("panel_utility_id") REFERENCES "utility_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_circuits" ADD CONSTRAINT "equipment_circuits_circuit_id_fkey" FOREIGN KEY ("circuit_id") REFERENCES "electrical_circuits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_circuits" ADD CONSTRAINT "equipment_circuits_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
