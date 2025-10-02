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
      <div className="mb-4 rounded border bg-amber-50 p-3 text-sm text-amber-800">
        This page is deprecated. Use <a href="/admin/tools" className="underline">/admin/tools</a> → "Usage & Telemetry" instead.
      </div>
    </main>
  )
}
