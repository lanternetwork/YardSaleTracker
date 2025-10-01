'use client'
import { useEffect, useState } from 'react'

export default function EnvironmentDebug() {
  const [envDebug, setEnvDebug] = useState<any>(null)

  const debugEnvironment = () => {
    const rawEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    }

    // Test if env validation is working
    let envValidation = null
    try {
      const { ENV_PUBLIC } = require('@/lib/env')
      envValidation = {
        success: true,
        values: ENV_PUBLIC
      }
    } catch (error: any) {
      envValidation = {
        success: false,
        error: error.message
      }
    }

    setEnvDebug({
      raw: rawEnv,
      validation: envValidation,
      nodeEnv: process.env.NODE_ENV,
      vitest: process.env.VITEST
    })
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-800 font-medium">🔧 Environment Debug</h3>
        <button
          onClick={debugEnvironment}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
        >
          Debug Environment
        </button>
      </div>
      
      {envDebug && (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Raw Environment Variables</h4>
            <div className="text-sm space-y-1">
              <div>SUPABASE_URL: {envDebug.raw.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div>SUPABASE_KEY: {envDebug.raw.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</div>
              <div>GOOGLE_MAPS: {envDebug.raw.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 20)}...</div>
              <div>SITE_URL: {envDebug.raw.NEXT_PUBLIC_SITE_URL}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Environment Validation</h4>
            <div className="text-sm">
              {envDebug.validation.success ? (
                <div className="text-green-600">
                  <div>✅ Validation passed</div>
                  <div>URL: {envDebug.validation.values.NEXT_PUBLIC_SUPABASE_URL}</div>
                  <div>Key: {envDebug.validation.values.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</div>
                </div>
              ) : (
                <div className="text-red-600">
                  <div>❌ Validation failed</div>
                  <div>Error: {envDebug.validation.error}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Environment Context</h4>
            <div className="text-sm">
              <div>NODE_ENV: {envDebug.nodeEnv}</div>
              <div>VITEST: {envDebug.vitest}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
