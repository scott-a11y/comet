// Component Library Catalog
// Pre-defined components for shop floor design

import { Component, ComponentCategory } from '@/lib/types/building-geometry';

export type ComponentTemplate = Omit<Component, 'id' | 'x' | 'y' | 'rotation'>;

export const COMPONENT_CATALOG: Record<ComponentCategory, ComponentTemplate[]> = {
    furniture: [
        {
            category: 'furniture',
            name: 'Workbench',
            width: 6,
            depth: 2.5,
            height: 3,
            color: '#8B4513',
            metadata: {
                notes: 'Standard workbench with storage'
            }
        },
        {
            category: 'furniture',
            name: 'Assembly Table',
            width: 8,
            depth: 4,
            height: 3,
            color: '#A0522D',
            metadata: {
                notes: 'Large assembly surface'
            }
        },
        {
            category: 'furniture',
            name: 'Office Desk',
            width: 5,
            depth: 2.5,
            height: 2.5,
            color: '#654321',
        }
    ],
    cabinet: [
        {
            category: 'cabinet',
            name: 'Tool Cabinet',
            width: 3,
            depth: 2,
            height: 6,
            color: '#FF6B35',
            metadata: {
                notes: 'Vertical tool storage'
            }
        },
        {
            category: 'cabinet',
            name: 'Parts Cabinet',
            width: 4,
            depth: 1.5,
            height: 6,
            color: '#F7931E',
            metadata: {
                notes: 'Small parts organization'
            }
        },
        {
            category: 'cabinet',
            name: 'Supply Cabinet',
            width: 3,
            depth: 2,
            height: 7,
            color: '#FDC830',
        }
    ],
    machinery: [
        {
            category: 'machinery',
            name: 'Table Saw',
            width: 5,
            depth: 4,
            height: 3.5,
            color: '#DC143C',
            metadata: {
                powerRequirement: '240V, 20A',
                manufacturer: 'SawStop',
                notes: 'Requires dust collection'
            }
        },
        {
            category: 'machinery',
            name: 'CNC Router',
            width: 8,
            depth: 6,
            height: 5,
            color: '#4169E1',
            metadata: {
                powerRequirement: '240V, 30A',
                notes: 'Requires compressed air and dust collection'
            }
        },
        {
            category: 'machinery',
            name: 'Lathe',
            width: 6,
            depth: 3,
            height: 4,
            color: '#228B22',
            metadata: {
                powerRequirement: '240V, 15A'
            }
        },
        {
            category: 'machinery',
            name: 'Milling Machine',
            width: 5,
            depth: 5,
            height: 6,
            color: '#4682B4',
            metadata: {
                powerRequirement: '240V, 20A'
            }
        },
        {
            category: 'machinery',
            name: 'Band Saw',
            width: 3,
            depth: 3,
            height: 6,
            color: '#FF4500',
            metadata: {
                powerRequirement: '120V, 15A',
                notes: 'Requires dust collection'
            }
        }
    ],
    equipment: [
        {
            category: 'equipment',
            name: 'Air Compressor',
            width: 3,
            depth: 2,
            height: 4,
            color: '#FFD700',
            metadata: {
                powerRequirement: '240V, 30A',
                notes: 'Compressed air source'
            }
        },
        {
            category: 'equipment',
            name: 'Dust Collector',
            width: 4,
            depth: 3,
            height: 7,
            color: '#9370DB',
            metadata: {
                powerRequirement: '240V, 20A',
                notes: 'Central dust collection'
            }
        },
        {
            category: 'equipment',
            name: 'Welding Station',
            width: 4,
            depth: 3,
            height: 5,
            color: '#FF8C00',
            metadata: {
                powerRequirement: '240V, 50A',
                notes: 'Requires ventilation'
            }
        }
    ],
    storage: [
        {
            category: 'storage',
            name: 'Lumber Rack',
            width: 8,
            depth: 2,
            height: 6,
            color: '#8B7355',
            metadata: {
                notes: 'Wall-mounted or freestanding'
            }
        },
        {
            category: 'storage',
            name: 'Sheet Goods Rack',
            width: 5,
            depth: 2,
            height: 8,
            color: '#A0826D',
            metadata: {
                notes: 'Vertical sheet storage'
            }
        },
        {
            category: 'storage',
            name: 'Mobile Cart',
            width: 3,
            depth: 2,
            height: 3,
            color: '#696969',
            metadata: {
                notes: 'Movable storage'
            }
        },
        {
            category: 'storage',
            name: 'Heavy Duty Pallet Rack',
            width: 8.5,
            depth: 3.5,
            height: 12,
            color: '#FF4500',
            metadata: {
                notes: 'Standard industrial pallet racking'
            }
        },
        {
            category: 'storage',
            name: 'Teardrop Racking (8ft)',
            width: 8,
            depth: 3.5,
            height: 10,
            color: '#FF8C00',
            metadata: {
                notes: 'Standard 8ft beam racking'
            }
        },
        {
            category: 'storage',
            name: 'Cantilever Rack',
            width: 6,
            depth: 4,
            height: 8,
            color: '#4682B4',
            metadata: {
                notes: 'For lumber and pipe storage'
            }
        },
        {
            category: 'storage',
            name: 'Industrial Wire Shelving',
            width: 4,
            depth: 1.5,
            height: 6,
            color: '#C0C0C0',
            metadata: {
                notes: 'Chrome wire shelving'
            }
        },
        {
            category: 'storage',
            name: 'Small Parts Bin Rack',
            width: 3,
            depth: 1,
            height: 6,
            color: '#4169E1',
            metadata: {
                notes: 'Vertical bin organization'
            }
        }
    ]
};

// Helper to get all components as a flat array
export function getAllComponents(): ComponentTemplate[] {
    return Object.values(COMPONENT_CATALOG).flat();
}

// Helper to get components by category
export function getComponentsByCategory(category: ComponentCategory): ComponentTemplate[] {
    return COMPONENT_CATALOG[category] || [];
}

// Helper to create a new component instance from a template
export function createComponentFromTemplate(
    template: ComponentTemplate,
    x: number,
    y: number,
    rotation: number = 0
): Component {
    return {
        ...template,
        id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x,
        y,
        rotation
    };
}
