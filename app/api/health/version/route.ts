import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA || 'local'
    const env = process.env.VERCEL_ENV || 'local'
    const deployedAt = new Date().toISOString()

    return NextResponse.json({
      ok: true,
      sha,
      env,
      deployedAt
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'unknown' }, { status: 500 })
  }
}


