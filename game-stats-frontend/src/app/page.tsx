'use client'

import BackloggdImporter from '@/components/BackloggdImporter'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Backloggd Stats Viewer
          </h1>
          <p className="text-gray-300 text-lg">
            Import your gaming data and explore your collection
          </p>
        </div>
        
        <BackloggdImporter />
      </div>
    </main>
  )
}

