'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MapPin, Calendar, Sparkles } from 'lucide-react'

type Ev = { kind: 'event';   id: string; title: string; city?: string; start_date?: string; cover_image?: string; discipline_tags?: string[]; event_type?: string }
type Cr = { kind: 'creator'; id: string; full_name?: string; city?: string; disciplines?: string[]; avatar_url?: string; portfolio_images?: string[]; siret_verified?: boolean }

const PAGE = 20

function useFeed(filter: 'all' | 'events' | 'creators', page: number) {
  const [events,   setEvents]   = useState<Ev[]>([])
  const [creators, setCreators] = useState<Cr[]>([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(true)

  const load = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true)
    const from = p * PAGE
    const half = PAGE / 2
    const [evRes, crRes] = await Promise.all([
      f !== 'creators'
        ? supabase.from('events').select('id,title,city,start_date,cover_image,discipline_tags,event_type').eq('status','published').order('start_date',{ascending:true}).range(from, from+(f==='events'?PAGE-1:half-1))
        : Promise.resolve({ data: [] }),
      f !== 'events'
        ? supabase.from('creator_profiles').select('id,city,disciplines,portfolio_images,siret_verified,profiles(full_name,avatar_url)').order('id',{ascending:false}).range(from, from+(f==='creators'?PAGE-1:half-1))
        : Promise.resolve({ data: [] }),
    ])
    const evs: Ev[] = ((evRes as any).data||[]).map((e: any) => ({ kind:'event' as const, ...e }))
    const crs: Cr[] = ((crRes as any).data||[]).map((c: any) => ({
      kind: 'creator' as const,
      id: c.id,
      city: c.city,
      disciplines: c.disciplines,
      portfolio_images: c.portfolio_images,
      siret_verified: c.siret_verified,
      full_name: c.profiles?.full_name,
      avatar_url: c.profiles?.avatar_url,
    }))
    if (p===0) { setEvents(evs); setCreators(crs) }
    else       { setEvents(prev=>[...prev,...evs]); setCreators(prev=>[...prev,...crs]) }
    setHasMore(evs.length+crs.length >= 6)
    setLoading(false)
  }, [])

  useEffect(() => { setEvents([]); setCreators([]); load(0, filter) }, [filter, load])
  useEffect(() => { if (page>0) load(page, filter) }, [page, filter, load])
  return { events, creators, loading, hasMore }
}

// ── Cards ────────────────────────────────────────────────────────────────────

function EventHero({ item, onClick }: { item: Ev; onClick: () => void }) {
  const date = item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : null
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.35}}
      onClick={onClick} style={{ borderRadius:22, overflow:'hidden', position:'relative', height:300, cursor:'pointer', backgroundColor:'var(--ev-card-bg2)' }}>
      {item.cover_image && <Image src={item.cover_image} alt={item.title} fill sizes="1100px" style={{objectFit:'cover'}} />}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,5,20,.92) 0%,rgba(5,5,20,.25) 55%,transparent 100%)'}}/>
      <span style={{position:'absolute',top:14,left:14,backgroundColor:'#6366F1',color:'#fff',fontSize:10,fontWeight:700,borderRadius:20,padding:'3px 11px'}}>
        {item.event_type==='marche'?'🛍️ Marché':item.event_type==='festival'?'🎪 Festival':'📍 Événement'}
      </span>
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'20px 20px 22px'}}>
        <p style={{margin:'0 0 8px',fontSize:22,fontWeight:800,color:'#fff',lineHeight:1.2}}>{item.title}</p>
        <div style={{display:'flex',gap:12}}>
          {item.city && <span style={{fontSize:12,color:'rgba(255,255,255,.65)',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{item.city}</span>}
          {date      && <span style={{fontSize:12,color:'rgba(255,255,255,.65)',display:'flex',alignItems:'center',gap:4}}><Calendar size={11}/>{date}</span>}
        </div>
        {(item.discipline_tags||[]).length>0 && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
            {(item.discipline_tags||[]).slice(0,4).map((t:string)=>(
              <span key={t} style={{backgroundColor:'rgba(255,255,255,.15)',color:'rgba(255,255,255,.88)',fontSize:10,fontWeight:600,borderRadius:20,padding:'2px 9px',backdropFilter:'blur(4px)'}}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function EventCard({ item, onClick, tall=false }: { item: Ev; onClick: () => void; tall?: boolean }) {
  const date = item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : null
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.28}}
      onClick={onClick} style={{ borderRadius:18, overflow:'hidden', position:'relative', height:tall?260:200, cursor:'pointer', backgroundColor:'var(--ev-card-bg2)', flexShrink:0 }}>
      {item.cover_image && <Image src={item.cover_image} alt={item.title} fill sizes="400px" style={{objectFit:'cover'}} />}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,5,20,.88) 0%,rgba(5,5,20,.1) 60%,transparent 100%)'}}/>
      <span style={{position:'absolute',top:10,left:10,backgroundColor:'rgba(99,102,241,.9)',color:'#fff',fontSize:9,fontWeight:700,borderRadius:20,padding:'2px 8px'}}>
        {item.event_type==='marche'?'🛍️':'item.event_type'==='festival'?'🎪':'📍'} {item.event_type==='marche'?'Marché':item.event_type==='festival'?'Festival':'Événement'}
      </span>
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px 14px 14px'}}>
        <p style={{margin:'0 0 5px',fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.3}}>{item.title}</p>
        <div style={{display:'flex',gap:8}}>
          {item.city && <span style={{fontSize:10,color:'rgba(255,255,255,.6)',display:'flex',alignItems:'center',gap:2}}><MapPin size={9}/>{item.city}</span>}
          {date      && <span style={{fontSize:10,color:'rgba(255,255,255,.6)',display:'flex',alignItems:'center',gap:2}}><Calendar size={9}/>{date}</span>}
        </div>
      </div>
    </motion.div>
  )
}

function CreatorCircle({ item, onClick, delay=0 }: { item: Cr; onClick: () => void; delay?: number }) {
  const img = item.avatar_url || item.portfolio_images?.[0]
  return (
    <motion.div initial={{opacity:0,scale:.88}} animate={{opacity:1,scale:1}} transition={{duration:.28,delay}}
      onClick={onClick} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0,width:80 }}>
      <div style={{position:'relative',width:72,height:72,borderRadius:'50%',padding:2.5,background:item.siret_verified?'linear-gradient(135deg,#6366F1,#A855F7,#EC4899)':'linear-gradient(135deg,#D1D5DB,#9CA3AF)'}}>
        <div style={{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',backgroundColor:'var(--ev-card-bg2)',border:'2.5px solid var(--bg-primary)'}}>
          {img
            ? <Image src={img} alt={item.full_name||''} fill sizes="72px" style={{objectFit:'cover'}}/>
            : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:20,fontWeight:800,color:'#6366F1'}}>{item.full_name?.slice(0,1)||'?'}</span></div>
          }
        </div>
      </div>
      <div style={{textAlign:'center'}}>
        <p style={{margin:'0 0 2px',fontSize:11,fontWeight:700,color:'var(--ev-card-title)',lineHeight:1.2}}>{item.full_name?.split(' ')[0]}</p>
        {(item.disciplines||[])[0] && <p style={{margin:0,fontSize:9,color:'var(--ev-card-date)'}}>{(item.disciplines||[])[0]}</p>}
      </div>
    </motion.div>
  )
}

function CreatorCard({ item, onClick }: { item: Cr; onClick: () => void }) {
  const img = item.portfolio_images?.[0] || item.avatar_url
  return (
    <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{duration:.28}}
      onClick={onClick} style={{ borderRadius:18,overflow:'hidden',display:'flex',backgroundColor:'var(--ev-card-bg)',border:'1px solid var(--ev-border)',cursor:'pointer',minHeight:90,flexShrink:0 }}>
      <div style={{position:'relative',width:90,flexShrink:0,backgroundColor:'var(--ev-card-bg2)'}}>
        {img
          ? <Image src={img} alt={item.full_name||''} fill sizes="90px" style={{objectFit:'cover'}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:22,fontWeight:800,color:'#6366F1',opacity:.6}}>{item.full_name?.slice(0,1)||'?'}</span></div>
        }
      </div>
      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',justifyContent:'center',gap:5,flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <p style={{margin:0,fontSize:14,fontWeight:700,color:'var(--ev-card-title)'}}>{item.full_name}</p>
          {item.siret_verified && <span style={{fontSize:9,color:'#6366F1',fontWeight:700}}>✓</span>}
        </div>
        {(item.disciplines||[]).length>0 && (
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {(item.disciplines||[]).slice(0,2).map((d:string)=>(
              <span key={d} style={{backgroundColor:'var(--ev-card-tag-bg)',color:'var(--ev-card-tag-text)',fontSize:9,fontWeight:600,borderRadius:20,padding:'2px 7px'}}>{d}</span>
            ))}
          </div>
        )}
        {item.city && <span style={{fontSize:10,color:'var(--ev-card-date)',display:'flex',alignItems:'center',gap:3}}><MapPin size={9}/>{item.city}</span>}
      </div>
    </motion.div>
  )
}

// ── Bento layout ─────────────────────────────────────────────────────────────
function BentoLayout({ events, creators, onNav }: { events: Ev[]; creators: Cr[]; onNav: (p: string) => void }) {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isDesktop) {
    // Mobile : liste verticale simple
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {events.slice(0,1).map(e => <EventHero key={e.id} item={e} onClick={() => onNav(`/events/${e.id}`)} />)}
        {/* Cercles créateurs */}
        {creators.length > 0 && (
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' as any }}>
            <div style={{ display:'flex', gap:16, padding:'4px 0 8px' }}>
              {creators.slice(0,8).map((c,i) => <CreatorCircle key={c.id} item={c} onClick={() => onNav(`/creators/${c.id}`)} delay={i*.05} />)}
            </div>
          </div>
        )}
        {events.slice(1).map(e => <EventCard key={e.id} item={e} onClick={() => onNav(`/events/${e.id}`)} />)}
        {creators.slice(0).map(c => <CreatorCard key={c.id} item={c} onClick={() => onNav(`/creators/${c.id}`)} />)}
      </div>
    )
  }

  // Desktop : bento en 3 colonnes avec patterns variés
  const ev = events
  const cr = creators

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Row 1 : hero + 2 créateurs cercles empilés + event tall */}
      {ev[0] && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 1fr', gap:14, alignItems:'stretch' }}>
          <EventHero item={ev[0]} onClick={() => onNav(`/events/${ev[0].id}`)} />
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-around', gap:12 }}>
            {cr.slice(0,2).map((c,i) => <CreatorCircle key={c.id} item={c} onClick={() => onNav(`/creators/${c.id}`)} delay={i*.08} />)}
          </div>
          {ev[1]
            ? <EventCard item={ev[1]} onClick={() => onNav(`/events/${ev[1].id}`)} tall />
            : <div style={{ borderRadius:18, backgroundColor:'var(--ev-card-bg)', border:'1px solid var(--ev-border)' }} />
          }
        </div>
      )}

      {/* Row 2 : 3 créateurs cartes horizontales */}
      {cr.length > 2 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {cr.slice(2,5).map(c => <CreatorCard key={c.id} item={c} onClick={() => onNav(`/creators/${c.id}`)} />)}
        </div>
      )}

      {/* Row 3 : 3 events medium */}
      {ev.length > 2 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {ev.slice(2,5).map(e => <EventCard key={e.id} item={e} onClick={() => onNav(`/events/${e.id}`)} />)}
        </div>
      )}

      {/* Row 4 : event wide + cercles créateurs */}
      {ev[5] && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
          <EventHero item={ev[5]} onClick={() => onNav(`/events/${ev[5].id}`)} />
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {cr.slice(5,7).map(c => <CreatorCard key={c.id} item={c} onClick={() => onNav(`/creators/${c.id}`)} />)}
          </div>
        </div>
      )}

      {/* Row 5 : events restants 2 colonnes */}
      {ev.length > 6 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {ev.slice(6,10).map(e => <EventCard key={e.id} item={e} onClick={() => onNav(`/events/${e.id}`)} />)}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomeFeedClient() {
  const user   = useAuthStore(s => s.user)
  const router = useRouter()
  const [filter, setFilter] = useState<'all'|'events'|'creators'>('all')
  const [page,   setPage]   = useState(0)
  const { events, creators, loading, hasMore } = useFeed(filter, page)

  return (
    <div style={{ backgroundColor:'var(--bg-primary)', minHeight:'100vh' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* Header */}
      <div style={{ position:'sticky', top:58, zIndex:9, backgroundColor:'var(--bg-primary)', borderBottom:'1px solid var(--ev-border)', padding:'10px 20px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Sparkles size={16} color="#6366F1"/>
            <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:'var(--ev-sort-active)' }}>Fil d'actu</h1>
            {user?.full_name && <span style={{ fontSize:13, color:'var(--ev-card-date)' }}>· Bonjour {user.full_name.split(' ')[0]} 👋</span>}
          </div>
          <div style={{ display:'flex', gap:8, paddingBottom:10 }}>
            {([['all','Tout'],['events','🛍️ Marchés'],['creators','👤 Créateurs']] as const).map(([key,label]) => (
              <button key={key} onClick={() => { setFilter(key); setPage(0) }} style={{ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', backgroundColor:filter===key?'#6366F1':'var(--ev-chip-bg)', color:filter===key?'#fff':'var(--ev-chip-text)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 20px 80px' }}>
        {loading && events.length===0 && creators.length===0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ height:300, borderRadius:22, backgroundColor:'var(--ev-card-bg)', backgroundImage:'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear' }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {Array.from({length:3}).map((_,i) => <div key={i} style={{ height:90, borderRadius:18, backgroundColor:'var(--ev-card-bg)', backgroundImage:'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear' }} />)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {Array.from({length:3}).map((_,i) => <div key={i} style={{ height:200, borderRadius:18, backgroundColor:'var(--ev-card-bg)', backgroundImage:'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear' }} />)}
            </div>
          </div>
        ) : (
          <BentoLayout events={events} creators={creators} onNav={p => router.push(p)} />
        )}

        {!loading && hasMore && (events.length+creators.length)>0 && (
          <button onClick={() => setPage(p=>p+1)} style={{ display:'block', width:200, margin:'24px auto 0', padding:'12px', borderRadius:14, border:'1px solid var(--ev-border)', backgroundColor:'var(--ev-card-bg)', color:'var(--ev-sort-active)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Voir plus
          </button>
        )}
        {loading && (events.length+creators.length)>0 && (
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--ev-card-date)', fontSize:13 }}>Chargement…</div>
        )}
        {!loading && events.length===0 && creators.length===0 && (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:40, margin:'0 0 12px' }}>🔍</p>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--ev-sort-active)' }}>Rien à afficher</p>
          </div>
        )}
      </div>
    </div>
  )
}
