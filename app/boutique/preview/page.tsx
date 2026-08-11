'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingBag, ArrowLeft, Euro, Package, Calendar, ExternalLink } from 'lucide-react'
import { NexModal } from '@/components/ui/nex-modal'


const MOCK_CREATOR = {
  full_name: 'Sophie Marchand',
  city: 'Lyon',
  avatar_url: 'https://i.pravatar.cc/150?img=47',
}

const MOCK_PRODUCTS = [
  {
    id: '1',
    title: 'Bague argent floral',
    description: 'Bague en argent 925 ciselée à la main, motif fleur de cerisier. Taille ajustable. Chaque pièce est unique.',
    price: 4800,
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop'],
    category: 'Bijoux',
    stock: 3,
    is_available: true,
  },
  {
    id: '2',
    title: 'Bol céramique tourné',
    description: 'Bol en grès tourné à la main, émaillé en bleu nuit. Passe au lave-vaisselle. Diamètre 14cm.',
    price: 3200,
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop'],
    category: 'Céramique',
    stock: 5,
    is_available: true,
  },
  {
    id: '3',
    title: 'Tote bag brodé',
    description: 'Sac en coton bio, broderie florale réalisée à la main. Format A4. Anse longue.',
    price: 2900,
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=300&fit=crop'],
    category: 'Textile',
    stock: 0,
    is_available: true,
  },
  {
    id: '4',
    title: 'Illustration — Les forêts',
    description: 'Illustration originale, format A3, impression giclée sur papier fine art 300g. Signée et numérotée (30 ex).',
    price: 5500,
    images: ['https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=300&fit=crop'],
    category: 'Illustration',
    stock: 12,
    is_available: true,
    featured: true,
  },
  {
    id: '5',
    title: 'Pendentif terre cuite',
    description: 'Pendentif en terre cuite émaillée, sur chaîne en laiton doré 45cm. Fait main, pièce unique.',
    price: 2200,
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=300&fit=crop'],
    category: 'Bijoux',
    stock: 2,
    is_available: true,
  },
  {
    id: '6',
    title: 'Carnet cuir végétal',
    description: 'Carnet A5 couverture cuir végétal brun, papier recyclé 100g, 96 pages, reliure copte.',
    price: 3800,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'],
    category: 'Cuir',
    stock: 8,
    is_available: true,
  },
]

export default function BoutiquePreviewPage() {
  const [selected, setSelected] = useState<typeof MOCK_PRODUCTS[0] | null>(null)


  return (
    <div style={{ backgroundColor: '#F5F5F7', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#06060f', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/boutique/preview" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'none', marginBottom: '20px' }}>
            <ArrowLeft size={12} /> Profil créateur
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Image src={MOCK_CREATOR.avatar_url} alt={MOCK_CREATOR.full_name} width={56} height={56}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Boutique de {MOCK_CREATOR.full_name}
                </h1>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  EN COURS
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{MOCK_CREATOR.city}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Package size={12} /> {MOCK_PRODUCTS.length} créations
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '24px auto 0', padding: '0 24px' }}>
        {/* Banner en cours */}
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px' }}>🛠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', margin: 0 }}>Boutique en cours de développement</p>
            <p style={{ fontSize: '12px', color: '#B45309', margin: 0 }}>Le paiement direct arrive bientôt — contactez le créateur via la messagerie pour commander.</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {MOCK_PRODUCTS.map(product => (
            <div key={product.id}
              onClick={() => setSelected(product)}
              style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ height: '160px', backgroundColor: '#F5F5F7', position: 'relative' }}>
                <Image src={product.images[0]} alt={product.title} fill style={{ objectFit: 'cover' }} />
                {product.featured && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(17,24,39,0.9)', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px' }}>
                    ✨ Avant-première
                  </div>
                )}
                {product.stock === 0 && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(249,250,251,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#888' }}>Épuisé</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{product.category}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.3 }}>{product.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Euro size={12} />{(product.price / 100).toFixed(2)}
                  </span>
                  {product.stock > 0 && product.stock <= 5 && (
                    <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 600 }}>+ que {product.stock}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <NexModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        subtitle={selected?.category}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', backgroundColor: 'var(--text-primary)', color: '#FFFFFF', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              <ExternalLink size={13} /> Contacter le créateur
            </button>
            <button onClick={() => setSelected(null)} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Fermer
            </button>
          </div>
        }
      >
        {selected && (
          <>
            {selected.images[0] && (
              <div style={{ position: 'relative', height: '200px', margin: '-20px -24px 16px', overflow: 'hidden' }}>
                <Image src={selected.images[0]} alt={selected.title} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>{selected.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{(selected.price / 100).toFixed(2)} €</span>
              {selected.stock > 0
                ? <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>En stock ({selected.stock})</span>
                : <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Épuisé</span>
              }
            </div>
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Comment acheter ?</p>
              <p style={{ margin: 0 }}>Contactez ce créateur via la messagerie Nexart pour commander cette création.</p>
            </div>
          </>
        )}
      </NexModal>
    </div>
  )
}
