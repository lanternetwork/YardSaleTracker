import { createSupabaseServerClient } from '@/lib/supabase/server'
import CopyButton from './CopyButton'

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-neutral-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Present?</th>
                  <th className="py-2 pr-4">Used by</th>
                  <th className="py-2">Risk if missing</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {[
                  { name: 'ENABLE_ADMIN_TOOLS', present: !!process.env.ENABLE_ADMIN_TOOLS, used: 'Admin tools visibility', risk: 'No /admin/tools' },
                  { name: 'NEXT_PUBLIC_SUPABASE_URL', present: !!process.env.NEXT_PUBLIC_SUPABASE_URL, used: 'Supabase client/server', risk: 'App cannot query DB' },
                  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, used: 'Supabase auth/reads', risk: 'App cannot authenticate/query' },
                  { name: 'NEXT_PUBLIC_SUPABASE_SCHEMA', present: !!process.env.NEXT_PUBLIC_SUPABASE_SCHEMA, used: 'Schema routing (v2/public)', risk: 'Wrong schema used' },
                  { name: 'NEXT_PUBLIC_MAPBOX_TOKEN', present: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN, used: 'Map rendering', risk: 'Maps degraded/off' },
                  { name: 'SEED_TOKEN', present: !!process.env.SEED_TOKEN, used: 'Admin seed endpoints', risk: 'Seeders disabled' },
                  { name: 'NOMINATIM_EMAIL', present: !!process.env.NOMINATIM_EMAIL, used: 'ZIP fallback politeness', risk: 'May be rate-limited' },
                  { name: 'CLOUDINARY_*', present: !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_SECRET), used: 'Uploads & media', risk: 'Upload/widget disabled' },
                  { name: 'SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN', present: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN), used: 'Error reporting', risk: 'No telemetry' },
                  { name: 'ENABLE_DISTANCE_SEARCH', present: !!process.env.ENABLE_DISTANCE_SEARCH, used: 'Feature flag (unused)', risk: 'None' },
                  { name: 'ENABLE_USAGE_LOGS|NEXT_PUBLIC_ENABLE_USAGE_LOGS', present: !!(process.env.ENABLE_USAGE_LOGS || process.env.NEXT_PUBLIC_ENABLE_USAGE_LOGS), used: 'Usage logs UI', risk: 'Logs hidden' },
                  { name: 'ENABLE_ZIP_WRITEBACK', present: process.env.ENABLE_ZIP_WRITEBACK === 'true', used: 'Writeback Nominatim → local', risk: 'Slower cold ZIP lookup' },
                ].map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{row.name}</td>
                    <td className="py-2 pr-4">{row.present ? '✅' : '❌'}</td>
                    <td className="py-2 pr-4 text-neutral-700">{row.used}</td>
                    <td className="py-2 text-neutral-700">{row.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <CopyButton
              text={[
                { name: 'ENABLE_ADMIN_TOOLS', present: !!process.env.ENABLE_ADMIN_TOOLS },
                { name: 'NEXT_PUBLIC_SUPABASE_URL', present: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
                { name: 'NEXT_PUBLIC_SUPABASE_SCHEMA', present: !!process.env.NEXT_PUBLIC_SUPABASE_SCHEMA },
                { name: 'NEXT_PUBLIC_MAPBOX_TOKEN', present: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN },
                { name: 'SEED_TOKEN', present: !!process.env.SEED_TOKEN },
                { name: 'NOMINATIM_EMAIL', present: !!process.env.NOMINATIM_EMAIL },
                { name: 'CLOUDINARY_*', present: !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_SECRET) },
                { name: 'SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN', present: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) },
                { name: 'ENABLE_DISTANCE_SEARCH', present: !!process.env.ENABLE_DISTANCE_SEARCH },
                { name: 'ENABLE_USAGE_LOGS|NEXT_PUBLIC_ENABLE_USAGE_LOGS', present: !!(process.env.ENABLE_USAGE_LOGS || process.env.NEXT_PUBLIC_ENABLE_USAGE_LOGS) },
                { name: 'ENABLE_ZIP_WRITEBACK', present: process.env.ENABLE_ZIP_WRITEBACK === 'true' },
              ].filter(x => !x.present).map(x => x.name).join('\n')}
            >Copy missing list</CopyButton>
          </div>
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


