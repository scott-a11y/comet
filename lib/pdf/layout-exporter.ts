/**
 * PDF Layout Exporter
 * Generates professional PDF documents for shop layouts
 */

export interface LayoutExportData {
  buildingName: string;
  layoutName: string;
  dimensions: {
    width: number;
    height: number;
  };
  equipment: Array<{
    name: string;
    category: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }>;
  entryPoints?: Array<{
    name: string;
    x: number;
    y: number;
    type: 'door' | 'loading_dock' | 'overhead_door';
  }>;
  utilityPoints?: Array<{
    name: string;
    type: string;
    x: number;
    y: number;
  }>;
  materialFlowPaths?: Array<{
    name: string;
    type: 'receiving' | 'processing' | 'shipping' | 'waste';
    points: Array<{ x: number; y: number }>;
    color: string;
  }>;
  optimizationScore?: number;
  notes?: string;
}

/**
 * Generate SVG representation of the layout
 */
export function generateLayoutSVG(data: LayoutExportData): string {
  const { dimensions, equipment, entryPoints = [], utilityPoints = [], materialFlowPaths = [] } = data;
  const scale = 10; // 10 pixels per foot
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;
  const padding = 40;

  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2;

  // Generate material flow paths (render first, so they're behind everything)
  const flowPathsSVG = materialFlowPaths
    .map((flow) => {
      const pathPoints = flow.points
        .map((p, i) => {
          const x = p.x * scale + padding;
          const y = p.y * scale + padding;
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

      // Create arrow marker
      const markerId = `arrow-${flow.type}`;

      return `
        <defs>
          <marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="${flow.color}" />
          </marker>
        </defs>
        <path 
          d="${pathPoints}" 
          stroke="${flow.color}" 
          stroke-width="3" 
          fill="none" 
          stroke-dasharray="5,5"
          marker-end="url(#${markerId})"
          opacity="0.7"
        />
        <text 
          x="${flow.points[Math.floor(flow.points.length / 2)].x * scale + padding}" 
          y="${flow.points[Math.floor(flow.points.length / 2)].y * scale + padding - 10}" 
          text-anchor="middle" 
          font-size="11" 
          font-weight="bold"
          fill="${flow.color}"
        >
          ${flow.name}
        </text>
      `;
    })
    .join('');

  // Generate equipment rectangles
  const equipmentSVG = equipment
    .map((eq) => {
      const x = eq.x * scale + padding;
      const y = eq.y * scale + padding;
      const w = eq.width * scale;
      const h = eq.height * scale;

      return `
        <g transform="translate(${x}, ${y}) rotate(${eq.rotation}, ${w / 2}, ${h / 2})">
          <rect 
            x="0" 
            y="0" 
            width="${w}" 
            height="${h}" 
            fill="#3b82f6" 
            fill-opacity="0.3" 
            stroke="#2563eb" 
            stroke-width="2"
          />
          <text 
            x="${w / 2}" 
            y="${h / 2}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-size="12" 
            font-weight="bold"
            fill="#1e40af"
          >
            ${eq.name}
          </text>
          <text 
            x="${w / 2}" 
            y="${h / 2 + 15}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-size="10" 
            fill="#64748b"
          >
            ${eq.width}' × ${eq.height}'
          </text>
        </g>
      `;
    })
    .join('');

  // Generate entry points
  const entryPointsSVG = entryPoints
    .map((entry) => {
      const x = entry.x * scale + padding;
      const y = entry.y * scale + padding;
      const icon = entry.type === 'loading_dock' ? '🚚' : entry.type === 'overhead_door' ? '🚪' : '🚪';
      const color = entry.type === 'loading_dock' ? '#10b981' : '#3b82f6';

      return `
        <g transform="translate(${x}, ${y})">
          <circle cx="0" cy="0" r="15" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
          <text x="0" y="5" text-anchor="middle" font-size="16">${icon}</text>
          <text x="0" y="30" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold">${entry.name}</text>
        </g>
      `;
    })
    .join('');

  // Generate utility points
  const utilityPointsSVG = utilityPoints
    .map((utility) => {
      const x = utility.x * scale + padding;
      const y = utility.y * scale + padding;

      // Choose icon and color based on utility type
      let icon = '⚡';
      let color = '#f59e0b';

      if (utility.type.toLowerCase().includes('dust')) {
        icon = '💨';
        color = '#8b5cf6';
      } else if (utility.type.toLowerCase().includes('air') || utility.type.toLowerCase().includes('compressor')) {
        icon = '🔧';
        color = '#06b6d4';
      } else if (utility.type.toLowerCase().includes('electrical') || utility.type.toLowerCase().includes('panel')) {
        icon = '⚡';
        color = '#f59e0b';
      }

      return `
        <g transform="translate(${x}, ${y})">
          <rect x="-18" y="-18" width="36" height="36" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2" rx="4"/>
          <text x="0" y="5" text-anchor="middle" font-size="18">${icon}</text>
          <text x="0" y="35" text-anchor="middle" font-size="9" fill="${color}" font-weight="bold">${utility.name}</text>
        </g>
      `;
    })
    .join('');

  return `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${svgWidth}" height="${svgHeight}" fill="#f8fafc"/>
      
      <!-- Grid -->
      <defs>
        <pattern id="grid" width="${scale * 5}" height="${scale * 5}" patternUnits="userSpaceOnUse">
          <path d="M ${scale * 5} 0 L 0 0 0 ${scale * 5}" fill="none" stroke="#e2e8f0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect x="${padding}" y="${padding}" width="${width}" height="${height}" fill="url(#grid)"/>
      
      <!-- Building outline -->
      <rect 
        x="${padding}" 
        y="${padding}" 
        width="${width}" 
        height="${height}" 
        fill="none" 
        stroke="#1e293b" 
        stroke-width="3"
      />
      
      <!-- Material Flow Paths (behind everything) -->
      ${flowPathsSVG}
      
      <!-- Equipment -->
      ${equipmentSVG}
      
      <!-- Entry Points -->
      ${entryPointsSVG}
      
      <!-- Utility Points -->
      ${utilityPointsSVG}
      
      <!-- Dimensions -->
      <text x="${padding + width / 2}" y="${padding - 15}" text-anchor="middle" font-size="14" font-weight="bold">
        ${dimensions.width}' wide
      </text>
      <text 
        x="${padding - 15}" 
        y="${padding + height / 2}" 
        text-anchor="middle" 
        font-size="14" 
        font-weight="bold"
        transform="rotate(-90, ${padding - 15}, ${padding + height / 2})"
      >
        ${dimensions.height}' deep
      </text>
    </svg>
  `;
}

/**
 * Generate HTML for PDF export
 */
export function generateLayoutHTML(data: LayoutExportData): string {
  const svg = generateLayoutSVG(data);
  const date = new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.buildingName} - ${data.layoutName}</title>
  <style>
    @page {
      size: letter landscape;
      margin: 0.5in;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
    }
    
    .header h1 {
      margin: 0;
      color: #1e293b;
      font-size: 28px;
    }
    
    .header h2 {
      margin: 5px 0;
      color: #64748b;
      font-size: 18px;
      font-weight: normal;
    }
    
    .info-bar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .info-item {
      text-align: center;
    }
    
    .info-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-top: 5px;
    }
    
    .layout-container {
      text-align: center;
      margin: 20px 0;
    }
    
    .equipment-list {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    
    .equipment-list h3 {
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }
    
    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .equipment-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    
    .equipment-name {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 5px;
    }
    
    .equipment-details {
      font-size: 12px;
      color: #64748b;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    
    .notes {
      margin-top: 20px;
      padding: 15px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    
    .notes h4 {
      margin: 0 0 10px 0;
      color: #92400e;
    }
    
    .notes p {
      margin: 0;
      color: #78350f;
      line-height: 1.6;
    }
    
    .legend {
      margin-top: 20px;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    
    .legend h4 {
      margin: 0 0 10px 0;
      color: #1e293b;
      font-size: 14px;
    }
    
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #475569;
    }
    
    .legend-icon {
      font-size: 16px;
      width: 24px;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.buildingName}</h1>
    <h2>${data.layoutName}</h2>
  </div>
  
  <div class="info-bar">
    <div class="info-item">
      <div class="info-label">Building Size</div>
      <div class="info-value">${data.dimensions.width}' × ${data.dimensions.height}'</div>
    </div>
    <div class="info-item">
      <div class="info-label">Equipment Count</div>
      <div class="info-value">${data.equipment.length}</div>
    </div>
    ${data.optimizationScore
      ? `
    <div class="info-item">
      <div class="info-label">Optimization Score</div>
      <div class="info-value">${data.optimizationScore.toFixed(1)}/100</div>
    </div>
    `
      : ''
    }
    <div class="info-item">
      <div class="info-label">Generated</div>
      <div class="info-value">${date}</div>
    </div>
  </div>
  
  <div class="layout-container">
    ${svg}
  </div>
  
  <div class="equipment-list">
    <h3>Equipment Inventory (${data.equipment.length} items)</h3>
    <div class="equipment-grid">
      ${data.equipment
      .map(
        (eq) => `
        <div class="equipment-card">
          <div class="equipment-name">${eq.name}</div>
          <div class="equipment-details">
            Category: ${eq.category}<br>
            Size: ${eq.width}' × ${eq.height}'<br>
            Position: (${eq.x}', ${eq.y}')<br>
            Rotation: ${eq.rotation}°
          </div>
        </div>
      `
      )
      .join('')}
    </div>
  </div>
  
  ${data.notes
      ? `
  <div class="notes">
    <h4>📋 Notes</h4>
    <p>${data.notes}</p>
  </div>
  `
      : ''
    }
  
  <!-- Legend -->
  <div class="legend">
    <h4>📖 Legend</h4>
    <div class="legend-grid">
      <div class="legend-item">
        <span class="legend-icon">🚪</span>
        <span>Door / Entry</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">🚚</span>
        <span>Loading Dock</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">⚡</span>
        <span>Electrical Panel</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">💨</span>
        <span>Dust Collection</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">🔧</span>
        <span>Air Compressor</span>
      </div>
      <div class="legend-item">
        <span style="color: #10b981;">━━➤</span>
        <span>Receiving Flow</span>
      </div>
      <div class="legend-item">
        <span style="color: #3b82f6;">━━➤</span>
        <span>Processing Flow</span>
      </div>
      <div class="legend-item">
        <span style="color: #f59e0b;">━━➤</span>
        <span>Shipping Flow</span>
      </div>
      <div class="legend-item">
        <span style="color: #ef4444;">━━➤</span>
        <span>Waste Flow</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    Generated by Comet Shop Layout Tool • ${new Date().toLocaleString()}
  </div>
</body>
</html>
  `;
}
