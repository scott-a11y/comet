import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Layout2DView } from "@/components/layout/Layout2DView";
import Link from "next/link";

interface PageProps {
    params: {
        id: string;
    };
}

export default async function Building2DLayoutPage({ params }: PageProps) {
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
        <div className="relative">
            {/* Back Button */}
            <Link
                href={`/buildings/${buildingId}`}
                className="absolute top-4 left-4 z-10 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
                ← Back to Building
            </Link>

            <Layout2DView building={building} />
        </div>
    );
}
