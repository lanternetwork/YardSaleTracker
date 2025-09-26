'use client'

export default function SimpleDebug() {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-yellow-800 font-medium">🔧 Simple Debug Test</h3>
      <p className="text-yellow-600 text-sm mt-1">
        If you can see this, the debug components are working!
      </p>
      <div className="mt-2 text-xs text-yellow-500">
        Environment check: {process.env.NODE_ENV}
      </div>
    </div>
  )
}
