import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const creatorId = user.id

    // Get profile views
    const { data: profileViews } = await supabase
      .from('profile_views')
      .select('id')
      .eq('profile_id', creatorId)
      .gte('viewed_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    // Get applications
    const { data: applications } = await supabase
      .from('applications')
      .select('id, status')
      .eq('creator_id', creatorId)

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', creatorId)

    // Calculate stats
    const acceptedCount = applications?.filter(a => a.status === 'accepted').length || 0
    const rejectedCount = applications?.filter(a => a.status === 'refused').length || 0
    const totalApplications = applications?.length || 0
    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0
    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      profileViews: profileViews?.length || 0,
      applicationsReceived: totalApplications,
      acceptedCount,
      rejectedCount,
      averageRating,
      reviewCount: reviews?.length || 0,
      acceptanceRate,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Erreur chargement analytics' }, { status: 500 })
  }
}
