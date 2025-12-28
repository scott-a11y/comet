'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';
import { startPdfAnalysis } from '@/actions/analyze';
import { useJobPolling } from '@/hooks/use-job-polling';
import { FloorPlanData } from '@/lib/types/pdf-analysis';
import { WallEditor } from './_components/wall-editor';
import type { BuildingFloorGeometry } from '@/lib/types/building-geometry';

export default function NewBuildingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<FloorPlanData | null>(null);
  const [manualEnabled, setManualEnabled] = useState(false);
  const [floorGeometry, setFloorGeometry] = useState<BuildingFloorGeometry | null>(null);
  const [floorScaleFtPerUnit, setFloorScaleFtPerUnit] = useState<number | null>(null);
  const [floorPlanePoints, setFloorPlanePoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    width: '',
    length: '',
    height: ''
  });

  // Use polling hook
  useJobPolling({
    jobId,
    onComplete: (data: any) => {
      setExtractedData(data);
      setAnalyzing(false);

      // Auto-populate form
      if (data.width) setFormData(prev => ({ ...prev, width: data.width.toString() }));
      if (data.length) setFormData(prev => ({ ...prev, length: data.length.toString() }));
      if (data.height) setFormData(prev => ({ ...prev, height: data.height.toString() }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const widthFt = formData.width ? parseFloat(formData.width) : undefined;
      const depthFt = formData.length ? parseFloat(formData.length) : undefined;
      const ceilingHeightFt = formData.height ? parseFloat(formData.height) : undefined;

      const hasDims = typeof widthFt === 'number' && !Number.isNaN(widthFt)
        && typeof depthFt === 'number' && !Number.isNaN(depthFt);
      const hasGeom = !!floorGeometry;

      if (!hasDims && !hasGeom) {
        throw new Error('Please provide dimensions, or draw walls manually.');
      }

      if (hasGeom) {
        if (floorValidationError) {
          throw new Error(`Wall drawing is invalid: ${floorValidationError}`);
        }
        if (!floorScaleFtPerUnit) {
          throw new Error('Please calibrate your drawing (ft per unit) before creating the building.');
        }
      }

      const requestData = {
        name: formData.name,
        widthFt: hasDims ? widthFt : undefined,
        depthFt: hasDims ? depthFt : undefined,
        ceilingHeightFt: ceilingHeightFt,
        pdfUrl: pdfUrl || undefined,
        extractedData: extractedData || undefined,
        floorGeometry: floorGeometry || undefined,
        floorScaleFtPerUnit: floorScaleFtPerUnit || undefined,
        // keep address client-only for now; not in DB schema
      };

      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create building');
      }

      const building = await response.json();
      router.push(`/buildings/${building.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setPdfFile(file);
        setError(null);
        await handlePdfUpload(file);
      } else {
        setError('Please select an image file (PNG, JPG, JPEG, or WEBP)');
      }
    }
  };

  const handlePdfUpload = async (file: File) => {
    setAnalyzing(true);
    setError(null);

    try {
      // Step 1: Upload PDF directly to Vercel Blob
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      setPdfUrl(blob.url);

      // Step 2: Start PDF analysis job
      const [result, error] = await startPdfAnalysis({ pdfUrl: blob.url });

      if (error) {
        throw new Error(error.message || 'Failed to start floor plan analysis');
      }

      setJobId(result.jobId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      console.error('PDF processing error:', err);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/buildings"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Buildings
          </Link>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">New Building</h1>
          <p className="text-slate-400 mb-6">
            Create a new shop building to start planning your layout
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Building Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Shop, Building A"
              />
            </div>

            <div className="text-xs text-slate-500">
              You can either upload a floor plan image or use <strong>Draw walls manually</strong> below.
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 123 Workshop St, Portland, OR"
              />
            </div>

            <div>
              <label htmlFor="pdf" className="block text-sm font-medium text-slate-300 mb-2">
                Upload Floor Plan Image (Optional)
              </label>
              <input
                type="file"
                id="pdf"
                name="pdf"
                accept=".png,.jpg,.jpeg,.webp,image/*"
                onChange={handleFileChange}
                disabled={analyzing}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {pdfFile && (
                <p className="mt-2 text-sm text-slate-400">
                  Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {analyzing && (
                <div className="mt-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <p className="text-blue-200">Analyzing floor plan...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-white font-semibold">Draw walls manually (optional)</h3>
                  <p className="text-slate-400 text-sm">
                    Use this if you don't have a floor plan image, or if image analysis fails.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-slate-200 text-sm">
                  <input
                    type="checkbox"
                    checked={manualEnabled}
                    onChange={(e) => setManualEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Enable manual drawing
                </label>
              </div>

              {manualEnabled && (
                <div className="mt-4">
                  <WallEditor
                    onChange={({ geometry, scaleFtPerUnit, floorPlanePoints, validationError }) => {
                      setFloorGeometry(geometry);
                      setFloorScaleFtPerUnit(scaleFtPerUnit);
                      setFloorPlanePoints(floorPlanePoints);
                      setFloorValidationError(validationError);
                    }}
                  />

                  <div className="mt-3 text-xs text-slate-400">
                    When you create the building, we’ll save the vertex/segment geometry + calibration on the building.
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-slate-300 mb-2">
                  Width (ft)
                </label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  min="1"
                  step="0.1"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              <div>
                <label htmlFor="length" className="block text-sm font-medium text-slate-300 mb-2">
                  Length (ft)
                </label>
                <input
                  type="number"
                  id="length"
                  name="length"
                  min="1"
                  step="0.1"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-2">
                  Height (ft)
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  min="1"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="16"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Tip: You can either enter Width/Length/Height, or enable manual drawing and calibrate the floor outline.
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Building'}
              </button>
              <Link
                href="/buildings"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {extractedData && (
            <div className="mt-8 p-6 bg-slate-900/50 rounded-lg border border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-4">Extracted Floor Plan Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Dimensions</h4>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>Width: {extractedData.width} ft</p>
                    <p>Length: {extractedData.length} ft</p>
                    {extractedData.height && (
                      <p>Height: {extractedData.height} ft</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
                  <p className="text-sm text-slate-400">{extractedData.summary}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}