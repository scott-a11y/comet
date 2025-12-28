import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

export default async function NewLayoutPage({ params }: Props) {
  const { id } = await Promise.resolve(params)
  const shopBuildingId = parseInt(id, 10)
  if (Number.isNaN(shopBuildingId)) notFound()

  // Minimal "create then go" behavior
  const layout = await prisma.layoutInstance.create({
    data: {
      shopBuildingId,
      name: 'New Layout',
    },
    select: { id: true },
  })

  redirect(`/buildings/${shopBuildingId}/layouts/${layout.id}`)
}
