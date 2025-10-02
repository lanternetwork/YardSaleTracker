import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function Masked({ value }: { value: string | undefined | null }) {
  if (!value) return <span className="text-neutral-500">false</span>
  return <span className="text-neutral-700">true</span>
}

function Section({ title, children, description }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{description}</p>
      <div className="mt-4">
        {children}
      </div>
    </section>
  )
}

export default async function AdminToolsPage() {
  // Feature flag
  const enabled = process.env.ENABLE_ADMIN_TOOLS === 'true'
  if (!enabled) {
    // Not found to avoid leaking route existence
    // Next.js will render 404
    // @ts-ignore
    return null
  }

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const unauthenticated = !user

  // Version info
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)
  const env = process.env.VERCEL_ENV || 'local'
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public'
  let deployedAt: string | null = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/health/version`, { cache: 'no-store' })
    const json = await res.json()
    if (json?.ok) deployedAt = json.deployedAt
  } catch {}

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Tools</h1>
          <p className="text-sm text-neutral-600">Consolidated diagnostics and limited tools. Secrets never shown.</p>
        </div>
        <div className={`rounded px-2 py-1 text-sm ${unauthenticated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {unauthenticated ? 'Unauthenticated — limited view' : 'Authenticated'}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Section title="Overview & Version" description="High-level app info, build version, and deployment environment.">
          <div className="text-sm text-neutral-700 space-y-2">
            <div className="flex items-center gap-2">
              <div>Commit:</div>
              <code className="rounded bg-neutral-100 px-1 py-0.5">{sha}</code>
              <button className="rounded border px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(sha)}>Copy</button>
            </div>
            <div>Environment: <span className="font-mono">{env}</span></div>
            <div>Schema: <span className="font-mono">{schema}</span></div>
            <div>Deployed: <span className="font-mono">{deployedAt || 'unknown'}</span></div>
            <div>
              <button className="rounded border px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(`Commit: ${sha}\nEnvironment: ${env}\nSchema: ${schema}\nDeployed: ${deployedAt || 'unknown'}`)}>Copy diagnostics summary</button>
            </div>
          </div>
        </Section>
        <Section title="Overview & Version" description="High-level app info, build version, and deployment environment.">
          <div className="text-sm text-neutral-700 space-y-1">
            <div>Vercel env: <span className="font-mono">{process.env.VERCEL_ENV || 'local'}</span></div>
            <div>Commit: <span className="font-mono">{process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0,7) : 'local'}</span></div>
          </div>
        </Section>

        <Section title="Environment & Configuration" description="Feature flags and public config. Values masked to booleans.">
          <ul className="text-sm text-neutral-700 space-y-1">
            <li>ENABLE_ADMIN_TOOLS: <Masked value={process.env.ENABLE_ADMIN_TOOLS} /></li>
            <li>NEXT_PUBLIC_SUPABASE_URL: <Masked value={process.env.NEXT_PUBLIC_SUPABASE_URL} /></li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: <Masked value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} /></li>
            <li>NEXT_PUBLIC_SUPABASE_SCHEMA: <Masked value={process.env.NEXT_PUBLIC_SUPABASE_SCHEMA} /></li>
            <li>NEXT_PUBLIC_MAPBOX_TOKEN: <Masked value={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} /></li>
            <li>NOMINATIM_EMAIL: <Masked value={process.env.NOMINATIM_EMAIL} /></li>
          </ul>
        </Section>

        <Section title="Health Checks" description="Quick links and summaries of /api/health/* endpoints.">
          <div className="text-sm text-neutral-700">Placeholders for health summaries.</div>
        </Section>

        <Section title="Database & Schema" description="Schema details, RLS status, and geometry/index verifications.">
          <div className="text-sm text-neutral-700">Placeholders for schema checks.</div>
        </Section>

        <Section title="Maps & Location" description="Map token status, location detection diagnostics, and performance notes.">
          <div className="text-sm text-neutral-700">Placeholders for maps diagnostics.</div>
        </Section>

        <Section title="ZIP Lookup Tools" description="ZIP local lookup vs. Nominatim fallback, write-back status, and common ZIP probes.">
          <div className="text-sm text-neutral-700">Placeholders for ZIP tools.</div>
        </Section>

        <Section title="Sales API Tester" description="Quick tester for /api/sales with lat/lng/km and category filters.">
          <div className="text-sm text-neutral-700">Placeholders for API tester UI.</div>
        </Section>

        <Section title="Seeding & Data Tools" description="Admin seeders with Idempotency-Key and rate limits. Token required for writes.">
          <div className="text-sm text-neutral-700">Placeholders for seed tools.</div>
        </Section>

        <Section title="Usage & Telemetry" description="Usage logs, web vitals, and performance timing counters.">
          <div className="text-sm text-neutral-700">Placeholders for usage & telemetry.</div>
        </Section>

        <Section title="Danger Zone / Admin Only" description="Destructive actions with explicit token-only controls and warnings.">
          <div className="text-sm text-neutral-700">Placeholders for admin-only dangerous tools.</div>
        </Section>
      </div>
    </main>
  )
}


