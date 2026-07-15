export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer l'utilisateur depuis la session/auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Vérifier le token via Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const userId = user.id

    // Récupérer toutes les données de l'utilisateur
    const [profileData, applicationsData, conversationsData, messagesData, reviewsData, postsData] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId),
        supabase.from('applications').select('*').eq('creator_id', userId),
        supabase.from('conversations').select('*').eq('creator_id', userId),
        supabase.from('messages').select('*').eq('sender_id', userId),
        supabase.from('reviews').select('*').eq('reviewer_id', userId),
        supabase.from('posts').select('*').eq('author_id', userId),
      ])

    // Créer JSON export
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      user_email: user.email,
      profile: profileData.data || [],
      applications: applicationsData.data || [],
      conversations: conversationsData.data || [],
      messages: messagesData.data || [],
      reviews: reviewsData.data || [],
      posts: postsData.data || [],
      rights_notice:
        'Cet export contient toutes vos données personnelles stockées sur Nexart. Droits RGPD Articles 15-21 appliqués.',
    }

    // Retourner le JSON comme téléchargement
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nexart-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur export données' }, { status: 500 })
  }
}
