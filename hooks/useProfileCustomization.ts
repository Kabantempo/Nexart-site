'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PageSettings, mergePageSettings } from '@/lib/page-settings'

export function useProfileCustomization() {
  const [settings, setSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setError('Non connecté'); setLoading(false); return }

        const { data, error: dbErr } = await supabase
          .from('creator_profiles')
          .select('page_settings')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (dbErr) throw dbErr

        setUserId(session.user.id)
        setSettings(mergePageSettings((data?.page_settings as Partial<PageSettings> | null) ?? null))
      } catch (e) {
        setError((e as Error)?.message ?? 'Erreur chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = useCallback(async (patch: Partial<PageSettings>) => {
    if (!userId) return { ok: false, error: 'Profil non chargé' }
    setSaving(true)
    setError(null)

    const next = { ...settings, ...patch }
    setSettings(next as PageSettings) // optimistic

    try {
      const { error: dbErr } = await supabase
        .from('creator_profiles')
        .upsert({ user_id: userId, page_settings: next }, { onConflict: 'user_id' })

      if (dbErr) throw dbErr
      return { ok: true }
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Erreur sauvegarde'
      setError(msg)
      // rollback optimistic
      setSettings(settings)
      return { ok: false, error: msg }
    } finally {
      setSaving(false)
    }
  }, [userId, settings])

  const update = useCallback((patch: Partial<PageSettings>) => {
    setSettings(prev => prev ? { ...prev, ...patch } : patch as PageSettings)
  }, [])

  return { settings, loading, saving, error, save, update }
}
