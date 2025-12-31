'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEquipmentSchema, type CreateEquipmentInput, type CreateEquipmentFormValues } from '@/lib/validations/equipment'

interface Building {
  id: number
  name: string
}

export default function NewEquipmentPage() {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateEquipmentFormValues>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      shopBuildingId: 0, // Will act as placeholder
      name: '',
      category: '',
      widthFt: 0,
      depthFt: 0,
      orientation: 0,
      requiresDust: false,
      requiresAir: false,
      requiresHighVoltage: false,
    }
  })

  useEffect(() => {
    // Fetch buildings for the dropdown
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        setBuildings(data)
        setIsLoadingBuildings(false)
      })
      .catch(err => {
        console.error('Failed to fetch buildings:', err)
        toast.error('Failed to load buildings')
        setIsLoadingBuildings(false)
      })
  }, [])

  const onSubmit = async (data: CreateEquipmentFormValues) => {
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const responseData = await response.json()

      if (response.ok) {
        toast.success('Equipment created successfully!')
        router.push('/equipment')
        router.refresh()
      } else {
        toast.error(responseData.error || 'Failed to create equipment')
        if (responseData.details) {
          // Note: react-hook-form handles field errors automatically, 
          // but we can show server-side errors if needed.
          // In this case, most validation is duplicated on client.
          console.error('Validation errors:', responseData.details)
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Form submission error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Equipment</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Building *
              </label>
              <select
                {...register('shopBuildingId', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.shopBuildingId ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoadingBuildings}
              >
                <option value="0">Select a building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              {errors.shopBuildingId && (
                <p className="mt-1 text-sm text-red-600">{errors.shopBuildingId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              placeholder="e.g., CNC Router, Table Saw, Dust Collector"
              {...register('category')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (feet) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('widthFt', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.widthFt ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.widthFt && (
                <p className="mt-1 text-sm text-red-600">{errors.widthFt.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depth (feet) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('depthFt', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.depthFt ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.depthFt && (
                <p className="mt-1 text-sm text-red-600">{errors.depthFt.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation (°)
              </label>
              <input
                type="number"
                min="0"
                max="360"
                step="1"
                {...register('orientation', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.orientation ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.orientation && (
                <p className="mt-1 text-sm text-red-600">{errors.orientation.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Requirements
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requiresDust')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Requires Dust Collection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requiresAir')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Requires Compressed Air</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requiresHighVoltage')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Requires High Voltage</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Link
              href="/equipment"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Creating...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

