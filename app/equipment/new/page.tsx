'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewEquipmentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    lengthIn: 0,
    widthIn: 0,
    heightIn: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (response.ok) router.push('/equipment')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Add Equipment</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full px-4 py-2 border rounded"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Manufacturer"
            className="w-full px-4 py-2 border rounded"
            value={formData.manufacturer}
            onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
          />
          <div className="grid grid-cols-3 gap-4">
            <input type="number" placeholder="Length" className="px-4 py-2 border rounded"
              value={formData.lengthIn} onChange={(e) => setFormData({...formData, lengthIn: +e.target.value})} />
            <input type="number" placeholder="Width" className="px-4 py-2 border rounded"
              value={formData.widthIn} onChange={(e) => setFormData({...formData, widthIn: +e.target.value})} />
            <input type="number" placeholder="Height" className="px-4 py-2 border rounded"
              value={formData.heightIn} onChange={(e) => setFormData({...formData, heightIn: +e.target.value})} />
          </div>
          <div className="flex justify-between pt-4">
            <Link href="/equipment" className="px-6 py-2 border rounded">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded">Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}
