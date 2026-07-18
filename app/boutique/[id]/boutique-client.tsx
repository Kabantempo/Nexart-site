'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, ArrowLeft, Euro, Package, Calendar, ExternalLink } from 'lucide-react'

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
  featured_until?: string
  created_at: string
}

interface CreatorInfo {
  full_name: string
  avatar_url?: string
  bio?: string
  city?: string
}

export default function BoutiqueClient({ creatorId }: { creatorId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [creator, setCreator] = useState<CreatorInfo | null>(null)
  const [featuredEvents, setFeaturedEvents] = useState<Record<string, { id: string; title: string; city: string; start_date: string }>>({})
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: profile }, { data: cp }, { data: prods }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, bio').eq('id', creatorId).single(),
        supabase.from('creator_profiles').select('city').eq('user_id', creatorId).maybeSingle(),
        supabase.from('products').select('*').eq('creator_id', creatorId).eq('is_available', true).order('created_at', { ascending: false }),
      ])

      if (profile) setCreator({ ...profile, city: cp?.city ?? undefined } as any)
      if (prods) {
        setProducts(prods as any)
        // Charger les événements mis en avant
        const eventIds = prods.filter(p => p.featured_event_id).map(p => p.featured_event_id!)
        if (eventIds.length) {
          const { data: evs } = await supabase.from('events').select('id, title, city, start_date').in('id', eventIds)
          const map: typeof featuredEvents = {}
          evs?.forEach(e => { map[e.id] = e as any })
          setFeaturedEvents(map)
        }
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* En-tête créateur */}
      <div style={{ backgroundColor: 'var(--text-primary)', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href={`/creators/${creatorId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'none', marginBottom: '20px' }}>
            <ArrowLeft size={12} /> Profil créateur
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {creator?.avatar_url ? (
              <Image src={creator.avatar_url} alt={creator?.full_name || ''} width={56} height={56}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--text-body, #374151)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag size={24} color="rgba(255,255,255,0.5)" />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Boutique de {creator?.full_name || 'ce créateur'}
                </h1>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#6366F1', backgroundColor: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Pro
                </span>
              </div>
              {creator?.city && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{creator.city}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Package size={12} /> {products.length} création{products.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <ShoppingBag size={48} color="#E5E7EB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px' }}>Boutique vide</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ce créateur n&apos;a pas encore ajouté de créations.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {products.map(product => {
              const featuredEvent = product.featured_event_id ? featuredEvents[product.featured_event_id] : null
              const isExpiredFeature = product.featured_until && new Date(product.featured_until) < new Date()

              return (
                <div key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Image */}
                  <div style={{ height: '160px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={32} color="#E5E7EB" />
                      </div>
                    )}
                    {featuredEvent && !isExpiredFeature && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(17,24,39,0.9)', color: '#FFFFFF', fontSize: '10px', fontWeight: '700', padding: '3px 7px', borderRadius: '6px' }}>
                        ✨ Avant-première
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(249,250,251,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Épuisé</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px' }}>
                    {product.category && (
                      <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{product.category}</p>
                    )}
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.3 }}>{product.title}</p>

                    {featuredEvent && !isExpiredFeature && (
                      <p style={{ fontSize: '10px', color: '#6366F1', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={9} /> Dispo pour — {featuredEvent.title}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Euro size={12} />{(product.price / 100).toFixed(2)}
                      </span>
                      {product.stock > 0 && product.stock <= 5 && (
                        <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: '600' }}>+ que {product.stock}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal produit */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setSelectedProduct(null)}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', maxWidth: '480px', width: '100%', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            {selectedProduct.images?.[0] && (
              <img src={selectedProduct.images[0]} alt={selectedProduct.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px' }}>{selectedProduct.title}</p>
              {selectedProduct.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>{selectedProduct.description}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{(selectedProduct.price / 100).toFixed(2)} €</span>
                {selectedProduct.stock > 0 ? (
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>En stock ({selectedProduct.stock})</span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Épuisé</span>
                )}
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Comment acheter ?</p>
                <p style={{ margin: 0 }}>Contactez ce créateur via la messagerie Nexart pour commander cette création.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href={`/creators/${creatorId}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', backgroundColor: 'var(--text-primary)', color: '#FFFFFF', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> Contacter le créateur
                </Link>
                <button onClick={() => setSelectedProduct(null)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
