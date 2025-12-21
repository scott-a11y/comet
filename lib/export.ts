interface EquipmentPlacement {
  equipment: {
    name: string
    widthIn?: number
    lengthIn?: number
  }
  xPos: number
  yPos: number
  rotation: number
}

interface Layout {
  id: number | string
  equipmentPlacements: EquipmentPlacement[]
}

export async function exportLayoutToPNG(layoutId: string) {
  // Canvas to PNG conversion
  const canvas = document.getElementById('layout-canvas') as HTMLCanvasElement
  if (!canvas) return
  
  const link = document.createElement('a')
  link.download = `layout-${layoutId}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportLayoutToCSV(layout: Layout) {
  const rows: (string | number | undefined)[][] = [
    ['Equipment', 'X', 'Y', 'Width', 'Height', 'Rotation'],
    ...layout.equipmentPlacements.map((p) => [
      p.equipment.name,
      p.xPos,
      p.yPos,
      p.equipment.widthIn,
      p.equipment.lengthIn,
      p.rotation
    ])
  ]
  
  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `layout-${layout.id}.csv`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportLayoutToJSON(layout: Layout) {
  const json = JSON.stringify(layout, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `layout-${layout.id}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
