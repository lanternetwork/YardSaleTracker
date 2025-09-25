'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/security/admin'

export default function AdminIngestPage() {
  const [allowed, setAllowed] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: any) => {
      const em = data?.user?.email ?? null
      setEmail(em)
      setAllowed(isAdminEmail(em))
    })
  }, [])

  const trigger = async () => {
    setStatus('Triggering...')
    try {
      // Call our server route with server-supplied header (server→server only)
      const resp = await fetch('/api/ingest/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dryRun })
      })
      const json = await resp.json()
      setStatus(resp.ok ? `Accepted: ${JSON.stringify(json)}` : `Error: ${json.error || resp.statusText}`)
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  if (!allowed) {
    return <div className="p-6">Not Found</div>
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ingestion Control</h1>
      <div className="text-sm text-neutral-600">Signed in as: {email}</div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
          Dry Run
        </label>
        <button onClick={trigger} className="px-3 py-1 rounded bg-amber-500 text-white">Manual Trigger</button>
      </div>
      {status && <div className="text-sm text-neutral-700">{status}</div>}
    </div>
  )
}


