import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure web-push only if keys are available (not during build)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@yardsalefinder.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  } catch (error) {
    console.warn('VAPID keys not properly configured:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID is configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      )
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
          console.error('Error sending notification:', error)
          return { success: false, endpoint: sub.endpoint, error: (error as Error).message }
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
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
