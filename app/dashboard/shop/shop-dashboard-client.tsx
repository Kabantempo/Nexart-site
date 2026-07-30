'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  ShoppingBag, Plus, Edit2, Trash2, Package, Euro, Eye, EyeOff,
  ArrowLeft, X, Check, AlertCircle, ExternalLink, Tag, Layers,
  ChevronDown,
} from 'lucide-react'

interface Product {
  id: string
  creator_id: string
  title: string
  description?: string
  price: number
  images: string[]
  category?: string
  stock: number
  is_available: boolean
  featured_event_id?: string
  created_at: string
}

const CATEGORIES = [
  'Bijoux', 'Céramique', 'Textile', 'Illustration', 'Peinture',
  'Sculpture', 'Bois', 'Cuir', 'Verre', 'Photographie', 'Autre',
]

function ProductForm({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Partial<Product>
  onSave: (data: Partial<Product>) => void
  onClose: () => void
  loading: boolean
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priceStr, setPriceStr] = useState(initial?.price ? (initial.price / 100).toFixed(2) : '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [stock, setStock] = useState(String(initial?.stock ?? 1))
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0] ?? '')
  const [catOpen, setCatOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = Math.round(parseFloat(priceStr) * 100)
    if (!title.trim() || isNaN(price) || price <= 0) return
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      price,
      category: category || undefined,
      stock: parseInt(stock) || 1,
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '480px', width: '100%', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
            {initial?.id ? 'Modifier le produit' : 'Ajouter une création'}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: '#F5F5F7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#888" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {/* Titre */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
              Nom de la création <span style={{ color: '#E05A5A' }}>*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex : Bague argent floral"
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Matières, dimensions, technique utilisée…"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.5' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Prix + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
                Prix (€) <span style={{ color: '#E05A5A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Euro size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="number"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  style={{ width: '100%', padding: '10px 14px 10px 32px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#6366F1')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Stock</label>
              <div style={{ position: 'relative' }}>
                <Layers size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  min="0"
                  style={{ width: '100%', padding: '10px 14px 10px 32px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#6366F1')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Catégorie</label>
            <button
              type="button"
              onClick={() => setCatOpen(p => !p)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: category ? '#1A1A1A' : '#9CA3AF', backgroundColor: '#FFFFFF', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={14} color="#9CA3AF" />
                {category || 'Choisir une catégorie'}
              </span>
              <ChevronDown size={14} color="#9CA3AF" style={{ transition: 'transform 0.15s', transform: catOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {catOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                <button type="button" onClick={() => { setCategory(''); setCatOpen(false) }}
                  style={{ width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#9CA3AF', cursor: 'pointer' }}>
                  Aucune catégorie
                </button>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => { setCategory(cat); setCatOpen(false) }}
                    style={{ width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', backgroundColor: category === cat ? '#EEF2FF' : 'transparent', fontSize: '14px', color: category === cat ? '#6366F1' : '#1A1A1A', fontWeight: category === cat ? 700 : 400, cursor: 'pointer' }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>URL de l&apos;image</label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://… (optionnel)"
              type="url"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Upload d&apos;images via stockage — disponible bientôt</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '14px', fontWeight: 700, color: '#888', cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: loading ? '#C7D2FE' : '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Enregistrement…</>
              ) : (
                <><Check size={16} />{initial?.id ? 'Modifier' : 'Ajouter'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function ShopDashboardClient() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role, subscription_tier').eq('id', session.user.id).maybeSingle()
      if (profile?.role !== 'creator' && !(profile as any)?.is_creator) {
        router.push('/dashboard')
        return
      }
      setSubscriptionTier((profile as any)?.subscription_tier ?? 'free')
      setUserId(session.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    supabase.from('products').select('*').eq('creator_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts((data ?? []) as unknown as Product[])
        setLoading(false)
      })
  }, [userId])

  const handleSave = async (formData: Partial<Product>) => {
    if (!userId) return
    setSaving(true)
    try {
      if (editProduct) {
        const res = await fetch('/api/boutique', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editProduct.id, creator_id: userId, ...formData }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...json.product } : p))
        showToast('Produit modifié avec succès')
      } else {
        const res = await fetch('/api/boutique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creator_id: userId, ...formData }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setProducts(prev => [json.product as Product, ...prev])
        showToast('Création ajoutée avec succès')
      }
      setShowForm(false)
      setEditProduct(null)
    } catch (e: any) {
      showToast(e.message ?? 'Une erreur est survenue', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    const res = await fetch('/api/boutique', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, creator_id: userId, is_available: !product.is_available }),
    })
    if (res.ok) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p))
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/boutique?id=${id}&creator_id=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteConfirm(null)
      showToast('Produit supprimé')
    }
  }

  const maxProducts = subscriptionTier === 'premium' ? 50 : subscriptionTier === 'pro' ? 20 : 0
  const isCreatorTier = subscriptionTier === 'pro' || subscriptionTier === 'premium'

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F5F7', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, backgroundColor: toast.type === 'error' ? '#E05A5A' : '#10B981', color: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
          >
            {toast.type === 'success' ? <Check size={14} style={{ display: 'inline', marginRight: '8px' }} /> : <AlertCircle size={14} style={{ display: 'inline', marginRight: '8px' }} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ backgroundColor: '#06060f', padding: '32px 24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft size={12} /> Tableau de bord
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={20} color="#A5B4FC" />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Ma boutique</h1>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', padding: '3px 8px', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  EN COURS
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Gérez vos créations — paiement intégré bientôt disponible
              </p>
            </div>
            {userId && (
              <Link href={`/boutique/${userId}`} target="_blank"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                <ExternalLink size={13} /> Voir ma boutique
              </Link>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'créations', value: products.length },
              { label: 'disponibles', value: products.filter(p => p.is_available).length },
              { label: 'épuisées', value: products.filter(p => p.stock === 0).length },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>{s.value}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Banner plan si free */}
        {!isCreatorTier && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px 20px', borderRadius: '14px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', margin: '0 0 2px' }}>Boutique réservée aux abonnés Pro & Premium</p>
              <p style={{ fontSize: '12px', color: '#B45309', margin: 0 }}>Passez à un plan payant pour publier vos créations et commencer à vendre.</p>
            </div>
            <Link href="/offres" style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Voir les offres
            </Link>
          </motion.div>
        )}

        {/* Barre d'action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px' }}>Mes créations ({products.length}{isCreatorTier ? `/${maxProducts}` : ''})</h2>
            {isCreatorTier && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '100px', height: '4px', borderRadius: '99px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '99px', backgroundColor: products.length >= maxProducts ? '#E05A5A' : '#6366F1', width: `${Math.min((products.length / maxProducts) * 100, 100)}%`, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{maxProducts - products.length} restants</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditProduct(null); setShowForm(true) }}
            disabled={!isCreatorTier || products.length >= maxProducts}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', backgroundColor: (!isCreatorTier || products.length >= maxProducts) ? '#E5E7EB' : '#6366F1', color: (!isCreatorTier || products.length >= maxProducts) ? '#9CA3AF' : '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: (!isCreatorTier || products.length >= maxProducts) ? 'not-allowed' : 'pointer' }}>
            <Plus size={15} /> Ajouter une création
          </button>
        </div>

        {/* Liste produits */}
        {products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '64px 24px', borderRadius: '16px', border: '2px dashed #E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div style={{ width: 64, height: 64, borderRadius: '20px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Package size={28} color="#6366F1" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>Aucune création pour l&apos;instant</p>
            <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px' }}>Ajoutez vos premières créations pour les présenter à vos visiteurs.</p>
            {isCreatorTier && (
              <button onClick={() => setShowForm(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={16} /> Ajouter ma première création
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1px solid ${product.is_available ? '#E5E7EB' : '#F3F4F6'}`, overflow: 'hidden', opacity: product.is_available ? 1 : 0.7 }}
                >
                  {/* Image */}
                  <div style={{ height: '150px', backgroundColor: '#F5F5F7', position: 'relative' }}>
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={28} color="#E5E7EB" />
                      </div>
                    )}
                    {!product.is_available && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '99px', border: '1px solid #E5E7EB' }}>Masqué</span>
                      </div>
                    )}
                    {product.stock === 0 && product.is_available && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                        Épuisé
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div style={{ padding: '12px 14px' }}>
                    {product.category && (
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{product.category}</p>
                    )}
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{product.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A' }}>{(product.price / 100).toFixed(2)} €</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Stock : {product.stock}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleToggleAvailability(product)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: 600, color: product.is_available ? '#6366F1' : '#888', cursor: 'pointer' }}>
                        {product.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                        {product.is_available ? 'Visible' : 'Masqué'}
                      </button>
                      <button onClick={() => { setEditProduct(product); setShowForm(true) }}
                        style={{ width: 36, height: 36, borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={13} color="#888" />
                      </button>
                      <button onClick={() => setDeleteConfirm(product.id)}
                        style={{ width: 36, height: 36, borderRadius: '8px', border: '1px solid #FCA5A5', backgroundColor: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} color="#E05A5A" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Banner "coming soon" achat */}
        {products.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ marginTop: '24px', padding: '16px 20px', borderRadius: '14px', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={18} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#3730A3', margin: '0 0 2px' }}>Paiement intégré — bientôt disponible</p>
              <p style={{ fontSize: '12px', color: '#4F46E5', margin: 0 }}>Les acheteurs pourront payer directement depuis votre boutique. En attendant, ils vous contactent via la messagerie.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            initial={editProduct ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditProduct(null) }}
            loading={saving}
          />
        )}
      </AnimatePresence>

      {/* Modal confirmation suppression */}
      <AnimatePresence>
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', backgroundColor: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={22} color="#E05A5A" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', textAlign: 'center', margin: '0 0 8px' }}>Supprimer cette création ?</h3>
              <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', margin: '0 0 24px' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '14px', fontWeight: 700, color: '#888', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#E05A5A', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
