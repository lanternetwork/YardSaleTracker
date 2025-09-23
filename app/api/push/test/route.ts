import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createSupabaseServer } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure web-push
webpush.setVapidDetails(
  'mailto:admin@yardsalefinder.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check if we're in build mode - if so, return a simple response
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL) {
      return NextResponse.json({ 
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        message: 'Build mode - test notification skipped'
      })
    }

    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found' },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: 'YardSaleFinder Test',
      body: 'This is a test notification from YardSaleFinder!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: '/explore',
      tag: 'test-notification'
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          const err = error as Error
          console.error('Error sending notification:', err)
          return { success: false, endpoint: sub.endpoint, error: err.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: results.length
    })
  } catch (error) {
    const err = error as Error
    console.error('Test notification error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
