export interface Env {
  POST_URL: string
  INGEST_TOKEN: string
  SITES: string
  USER_AGENT?: string
}

async function fetchRss(site: string, ua: string): Promise<{ status: number; body: string; duration: number; contentType: string }> {
  const start = Date.now()
  const referer = site.split('?')[0]
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 10000)
  try {
    const resp = await fetch(site, {
      redirect: 'follow',
      headers: {
        'User-Agent': ua,
        'Accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': referer,
      },
      signal: controller.signal,
    })
    clearTimeout(t)
    const body = await resp.text()
    return { status: resp.status, body, duration: Date.now() - start, contentType: resp.headers.get('content-type') || '' }
  } catch (err) {
    clearTimeout(t)
    return { status: 0, body: '', duration: Date.now() - start, contentType: '' }
  }
}

async function postSnapshot(env: Env, site: string, xml: string) {
  return fetch(env.POST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-INGEST-TOKEN': env.INGEST_TOKEN,
    },
    body: JSON.stringify({ source: 'craigslist', site, xml }),
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/run') return new Response('Not Found', { status: 404 })
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
    const token = request.headers.get('X-INGEST-TOKEN')
    if (!token || token !== env.INGEST_TOKEN) return new Response('Unauthorized', { status: 401 })

    const sites = (env.SITES || '').split(',').map(s => s.trim()).filter(Boolean)
    if (sites.length === 0) return new Response(JSON.stringify({ message: 'No SITES configured' }), { headers: { 'Content-Type': 'application/json' } })

    const ua = env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

    const results: any[] = []
    for (const site of sites) {
      // up to 2 retries on 5xx
      let attempt = 0
      let rss: { status: number; body: string; duration: number; contentType: string } | null = null
      while (attempt < 3) {
        const r = await fetchRss(site, ua)
        rss = r
        if (r.status >= 500 && r.status < 600) {
          attempt++
          await new Promise(res => setTimeout(res, 500))
          continue
        }
        break
      }

      if (!rss) {
        results.push({ site, status: 0, posted: false, duration: 0 })
        continue
      }

      let posted = false
      if (rss.status === 200 && rss.body.trim().length > 0) {
        const resp = await postSnapshot(env, site, rss.body)
        posted = resp.ok
      }

      results.push({ site, status: rss.status, posted, duration: rss.duration })
    }

    return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } })
  },

  async scheduled(_event: any, env: Env): Promise<void> {
    const sites = (env.SITES || '').split(',').map(s => s.trim()).filter(Boolean)
    if (sites.length === 0) return
    const ua = env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    for (const site of sites) {
      const rss = await fetchRss(site, ua)
      if (rss.status === 200 && rss.body.trim().length > 0) {
        await postSnapshot(env, site, rss.body)
      }
      await new Promise(res => setTimeout(res, 200))
    }
  }
}


