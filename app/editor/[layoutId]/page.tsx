import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditorShell } from "./_components/editor-shell";
import { geometryToFloorPlane } from "@/lib/geometry/polygon";

interface EditorPageProps {
  params: {
    layoutId: string;
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const layout = await prisma.layout.findUnique({
    where: { id: params.layoutId },
    include: {
      building: {
        select: {
          name: true,
          widthFt: true,
          depthFt: true,
          pdfUrl: true,
          floorGeometry: true,
          floorScaleFtPerUnit: true,
        },
      },
    },
  });

  if (!layout) {
    notFound();
  }

  // Parse canvas state if it exists
  let canvasState: any[] = [];
  if (layout.canvasState) {
    try {
      canvasState = Array.isArray(layout.canvasState)
        ? layout.canvasState
        : JSON.parse(layout.canvasState as string);
    } catch (error) {
      console.error('Failed to parse canvas state:', error);
      canvasState = [];
    }
  }

  // Prefer manual polygon geometry if available; otherwise fall back to width/depth.
  // The 2D editor is currently in pixels, so we convert polygon units into feet using the saved calibration.
  let buildingDims = {
    width: layout.building.widthFt ?? 0,
    length: layout.building.depthFt ?? 0,
  };

  try {
    const geom = layout.building.floorGeometry as any;
    const scale = layout.building.floorScaleFtPerUnit ?? null;
    if (geom && scale) {
      const { plane } = geometryToFloorPlane(geom);
      if (plane?.points?.length) {
        const xs = plane.points.map((p) => p.x);
        const ys = plane.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const widthFt = (maxX - minX) * scale;
        const lengthFt = (maxY - minY) * scale;

        // Only override if it looks sane.
        if (isFinite(widthFt) && isFinite(lengthFt) && widthFt > 0 && lengthFt > 0) {
          buildingDims = { width: widthFt, length: lengthFt };
        }
      }
    }
  } catch (e) {
    // If geometry is malformed we keep the width/depth fallback.
    console.error('Failed to derive building dims from floorGeometry:', e);
  }

  const initialLayout = {
    ...layout,
    canvasState,
  };

  return (
    <EditorShell
      initialLayout={initialLayout}
      buildingDims={buildingDims}
      pdfUrl={layout.building.pdfUrl}
    />
  );
}