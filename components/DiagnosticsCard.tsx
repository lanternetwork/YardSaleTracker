'use client'
import { config } from '@/lib/config/env'
import Link from 'next/link'

export default function DiagnosticsCard() {
  // Only show in preview builds when diagnostics are enabled
  if (!config.features.diagnostics && !config.features.admin) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Developer Diagnostics</h3>
          <p className="text-xs text-blue-700 mt-1">
            Admin tools and system diagnostics
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Open Diagnostics
        </Link>
      </div>
    </div>
  )
}
