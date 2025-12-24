import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditorShell } from "./_components/editor-shell";

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

  const buildingDims = {
    width: layout.building.widthFt,
    length: layout.building.depthFt,
  };

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
