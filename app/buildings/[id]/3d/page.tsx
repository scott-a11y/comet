import { prisma } from "@/lib/prisma";
import { Scene } from "@/components/3d/Scene";
import { notFound } from "next/navigation";

interface PageProps {
    params: {
        id: string;
    };
}

export default async function Building3DPage({ params }: PageProps) {
    const buildingId = parseInt(params.id);

    if (isNaN(buildingId)) {
        return notFound();
    }

    const building = await prisma.shopBuilding.findUnique({
        where: { id: buildingId },
        include: {
            equipment: true
        }
    });

    if (!building) {
        return notFound();
    }

    return (
        <div className="h-screen w-full bg-slate-950">
            <Scene building={building} />
        </div>
    );
}
