"use client"
import { useEffect, useState } from 'react'
import { getUsageSnapshot, resetUsage } from '@/lib/usageLogs'

export default function UsageDiagnostics() {
  const [enabled, setEnabled] = useState(false)
  const [mapLoads, setMapLoads] = useState(0)
  const [geocodeCalls, setGeocodeCalls] = useState(0)
  const [firstEventAt, setFirstEventAt] = useState<number | undefined>(undefined)
  const [lastEventAt, setLastEventAt] = useState<number | undefined>(undefined)

  useEffect(() => {
    const raw = process.env.NEXT_PUBLIC_ENABLE_USAGE_LOGS
    const on = !!raw && ['1','true','yes','on'].includes(String(raw).toLowerCase())
    setEnabled(on)

    const sync = () => {
      const snap = getUsageSnapshot()
      if (snap) {
        setMapLoads(snap.mapLoads)
        setGeocodeCalls(snap.geocodeCalls)
        setFirstEventAt(snap.firstEventAt)
        setLastEventAt(snap.lastEventAt)
      }
    }

    sync()
    const id = setInterval(sync, 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString() : '—')

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Usage Diagnostics</h1>
      {!enabled && (
        <div className="mb-4 text-sm text-gray-600">Logging disabled. Set NEXT_PUBLIC_ENABLE_USAGE_LOGS=true to enable console events.</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">Map Loads</div>
          <div className="text-3xl font-semibold">{mapLoads}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">Geocode Calls</div>
          <div className="text-3xl font-semibold">{geocodeCalls}</div>
        </div>
      </div>
      <div className="mt-6 bg-white border rounded p-4 text-sm text-gray-700">
        <div>First Event: {fmt(firstEventAt)}</div>
        <div>Last Event: {fmt(lastEventAt)}</div>
      </div>
      <button
        className="mt-6 inline-flex items-center rounded bg-neutral-200 hover:bg-neutral-300 px-4 py-2 text-sm font-medium"
        onClick={() => {
          resetUsage()
        }}
      >
        Reset counters
      </button>
    </main>
  )
}
