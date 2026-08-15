export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET_TOKEN
  if (!cronSecret || req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const { error } = await (admin as any).rpc('cleanup_old_audit_logs')
    if (error) throw error

    // Count remaining logs for confirmation
    const { count } = await admin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Audit logs antérieurs à 2 ans supprimés (conformité RGPD)',
      remaining_logs: count,
      executed_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Cleanup audit logs error:', error)
    return NextResponse.json({ error: 'Erreur nettoyage audit logs' }, { status: 500 })
  }
}
