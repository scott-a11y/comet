import { z } from "zod";

export const machinerySpecsSchema = z.object({
    manufacturer: z.string().optional().describe("Manufacturer name"),
    model: z.string().optional().describe("Model number or name"),
    dimensions: z.object({
        width: z.number().optional().describe("Width in specified unit"),
        depth: z.number().optional().describe("Depth/Length in specified unit"),
        height: z.number().optional().describe("Height in specified unit"),
        unit: z.enum(["in", "ft", "mm", "cm", "m"]).default("in").describe("Unit of measurement"),
    }).describe("Physical dimensions of the machine"),
    weight: z.object({
        value: z.number().optional(),
        unit: z.enum(["lb", "kg", "ton"]).default("lb"),
    }).optional().describe("Operating weight"),
    electrical: z.object({
        voltage: z.number().optional().describe("Voltage (V)"),
        phase: z.number().optional().describe("Phase (1 or 3)"),
        amps: z.number().optional().describe("Amperage (A)"),
        power: z.number().optional().describe("Power consumption (kW or HP)"),
        unit: z.enum(["kW", "HP"]).optional(),
    }).optional().describe("Electrical requirements"),
    clearance: z.object({
        front: z.number().optional(),
        back: z.number().optional(),
        left: z.number().optional(),
        right: z.number().optional(),
        top: z.number().optional(),
        unit: z.enum(["in", "ft", "mm", "cm", "m"]).default("in"),
    }).optional().describe("Required service or safety clearance around the machine"),
});

export type MachinerySpecs = z.infer<typeof machinerySpecsSchema>;
