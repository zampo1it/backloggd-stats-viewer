'use client'

import { useState, useEffect } from 'react'
import StatsViewer from '@/components/StatsViewer'
import type { ApiResponse } from '@/types'

export default function StatsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Читаем данные из localStorage
    const savedData = localStorage.getItem('backloggdData')
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setData(parsed)
      } catch (err) {
        setError('Invalid data format in storage')
        localStorage.removeItem('backloggdData')
      }
    } else {
      setError('No data found. Please import your games first.')
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading statistics...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem('backloggdData')
              window.location.href = '/'
            }}
            className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
          >
            ← Back to Home
          </button>
        </div>
      </main>
    )
  }

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backloggd-stats-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Game Statistics
            </h1>
            <p className="text-gray-300">
              Analyzing {data.content?.games?.length || 0} games
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadJSON}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              Download JSON
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('backloggdData')
                window.location.href = '/'
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        <StatsViewer data={data} />
      </div>
    </main>
  )
}
