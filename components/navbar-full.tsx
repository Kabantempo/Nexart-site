'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, X, LogOut, Search, User, MessageCircle, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { NotificationBell } from '@/components/ui/notification-bell'

export function NavbarFull() {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [dropdown,    setDropdown]    = useState<string | null>(null)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [scrolled,    setScrolled]    = useState(false)
  const searchRef  = useRef<HTMLInputElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const user      = useAuthStore((s) => s.user)
  const setUser   = useAuthStore((s) => s.setUser)
  const router    = useRouter()
  const pathname  = usePathname()
  const firstName = user?.full_name?.split(' ')[0] ?? null
  const isHero    = pathname === '/'
  const dark      = isHero && !scrolled

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (p) setUser({ id: p.id, email: session.user.email || '', role: p.role, full_name: p.full_name, avatar_url: p.avatar_url })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) setUser(null) })
    return () => subscription.unsubscribe()
  }, [setUser, user])

  useEffect(() => { setMobileOpen(false); setDropdown(null) }, [pathname])

  const go = (ms = 200) => { closeTimer.current = setTimeout(() => setDropdown(null), ms) }
  const stay = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); router.push('/') }
  const openSearch   = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
  const closeSearch  = () => { setSearchOpen(false); setSearchValue('') }
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) { router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`); closeSearch() }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // ── Dropdown panel ────────────────────────────────────────────────
  const Panel = ({ id, children, align = 'left', width = 'w-52' }: { id: string; children: React.ReactNode; align?: 'left' | 'right' | 'center'; width?: string }) => (
    <AnimatePresence>
      {dropdown === id && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={stay}
          onMouseLeave={() => go()}
          className={`absolute top-full mt-2.5 ${width} bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/[0.08] p-1.5 origin-top z-50 ${
            align === 'right'  ? 'right-0' :
            align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
          }`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Nav trigger ───────────────────────────────────────────────────
  const Trigger = ({ id, label, active }: { id: string; label: string; active: boolean }) => (
    <button
      onMouseEnter={() => { stay(); setDropdown(id) }}
      onMouseLeave={() => go()}
      onClick={() => setDropdown(d => d === id ? null : id)}
      className={`flex items-center gap-1 text-[13.5px] font-medium px-3 py-2 transition-colors duration-150 select-none ${
        active
          ? dark ? 'text-white' : 'text-gray-900'
          : dark ? 'text-white/75 hover:text-white' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      <ChevronDown size={12} className={`transition-transform duration-200 opacity-50 ${dropdown === id ? 'rotate-180' : ''}`} />
    </button>
  )

  return (
    <>
      {/* ── Bar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'px-4 pt-3 pb-0' : 'px-0 pt-0 pb-0'
        }`}
      >
        <div className={`max-w-7xl mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-8 transition-all duration-500 ${
          scrolled
            ? 'bg-white/50 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-sm shadow-black/[0.04]'
            : dark
              ? 'bg-[#06060f] border-b border-white/6'
              : 'bg-white/90 backdrop-blur-xl border-b border-gray-100'
        }`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo-mark.png" alt="Nexart" width={26} height={26} className="rounded-lg" priority />
            <span className={`text-[15px] font-semibold tracking-tight transition-colors duration-300 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Nexart
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0 flex-1">

            {/* Découvrir */}
            <div className="relative" onMouseEnter={() => { stay(); setDropdown('discover') }} onMouseLeave={() => go()}>
              <Trigger id="discover" label="Découvrir" active={isActive('/events') || isActive('/creators')} />
              <Panel id="discover" width="w-[300px]">
                {[
                  { href: '/events',   label: 'Événements artisanaux', desc: 'Marchés, pop-ups, salons, festivals' },
                  { href: '/creators', label: 'Créateurs & Artisans',  desc: 'Parcourez les artisans inscrits' },
                ].map(({ href, label, desc }) => (
                  <Link key={href} href={href} onClick={() => setDropdown(null)}
                    className={`group flex items-start gap-3 px-3.5 py-3 rounded-xl transition-colors ${isActive(href) ? 'bg-gray-50' : 'hover:bg-gray-50/70'}`}
                  >
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-[13px] font-semibold leading-none mb-1 ${isActive(href) ? 'text-indigo-600' : 'text-gray-800'}`}>{label}</p>
                      <p className="text-[12px] text-gray-400">{desc}</p>
                    </div>
                    <ArrowUpRight size={13} className="text-gray-300 group-hover:text-gray-500 mt-0.5 transition-colors shrink-0" />
                  </Link>
                ))}
              </Panel>
            </div>

            {/* Ressources */}
            <div className="relative" onMouseEnter={() => { stay(); setDropdown('resources') }} onMouseLeave={() => go()}>
              <Trigger id="resources" label="Ressources" active={isActive('/about') || isActive('/blog') || isActive('/contact')} />
              <Panel id="resources">
                {[
                  { href: '/about',   label: 'À propos' },
                  { href: '/blog',    label: 'Blog' },
                  { href: '/contact', label: 'Contact' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setDropdown(null)}
                    className={`block px-3.5 py-2.5 rounded-xl text-[13px] transition-colors ${isActive(href) ? 'text-indigo-600 bg-indigo-50/60 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    {label}
                  </Link>
                ))}
              </Panel>
            </div>
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-1 ml-auto">

            {/* Search */}
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form key="open"
                  initial={{ width: 32, opacity: 0 }} animate={{ width: 200, opacity: 1 }} exit={{ width: 32, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={submitSearch}
                  className={`flex items-center gap-2 h-8 px-3 rounded-lg border overflow-hidden ${dark ? 'bg-white/8 border-white/12' : 'bg-gray-100 border-transparent'}`}
                >
                  <Search size={12} className={dark ? 'text-white/40 shrink-0' : 'text-gray-400 shrink-0'} />
                  <input ref={searchRef} value={searchValue} onChange={e => setSearchValue(e.target.value)}
                    placeholder="Rechercher…"
                    className={`flex-1 bg-transparent text-[13px] outline-none min-w-0 ${dark ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400'}`}
                  />
                  <button type="button" onClick={closeSearch}>
                    <X size={12} className={dark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'} />
                  </button>
                </motion.form>
              ) : (
                <motion.button key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={openSearch}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  <Search size={15} />
                </motion.button>
              )}
            </AnimatePresence>

            {user ? (
              <>
                <NotificationBell userId={user.id} />
                <Link href="/messages" className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  <MessageCircle size={16} />
                </Link>

                {/* Profile */}
                <div className="relative ml-1" onMouseEnter={() => { stay(); setDropdown('profile') }} onMouseLeave={() => go()}>
                  <button onClick={() => setDropdown(d => d === 'profile' ? null : 'profile')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${dark ? 'hover:bg-white/8' : 'hover:bg-gray-100'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                      {user.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[9px] font-black text-white">{firstName?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <span className={`text-[13px] font-medium transition-colors ${dark ? 'text-white/70' : 'text-gray-600'}`}>{firstName ?? 'Moi'}</span>
                    <ChevronDown size={11} className={`opacity-40 transition-transform ${dropdown === 'profile' ? 'rotate-180' : ''}`} />
                  </button>
                  <Panel id="profile" align="right" width="w-[190px]">
                    <div className="px-3.5 py-2.5 mb-1 border-b border-gray-100">
                      <p className="text-[12px] font-semibold text-gray-900">{firstName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      <User size={13} className="text-gray-400" /> Mon profil
                    </Link>
                    <Link href="/messages" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      <MessageCircle size={13} className="text-gray-400" /> Messages
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left">
                      <LogOut size={13} /> Déconnexion
                    </button>
                  </Panel>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 ml-1">
                <Link href="/login"
                  className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 ${dark ? 'text-white/75 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Connexion
                </Link>
                <Link href="/register"
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                    dark
                      ? 'bg-white text-gray-900 hover:bg-white/90'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            className={`lg:hidden ml-auto flex flex-col gap-[5px] justify-center w-8 h-8 transition-opacity ${dark ? 'opacity-70 hover:opacity-100' : 'opacity-50 hover:opacity-80'}`}
          >
            <motion.span animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className={`block h-[1.5px] w-5 rounded-full ${dark ? 'bg-white' : 'bg-gray-900'}`} />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.2 }} className={`block h-[1.5px] w-5 rounded-full ${dark ? 'bg-white' : 'bg-gray-900'}`} />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className={`block h-[1.5px] w-5 rounded-full ${dark ? 'bg-white' : 'bg-gray-900'}`} />
          </button>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#06060f]/96 backdrop-blur-2xl lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[58px] z-40 lg:hidden flex flex-col px-5 pt-8 pb-10 gap-1"
            >
              {[
                { href: '/events',   label: 'Événements' },
                { href: '/creators', label: 'Créateurs' },
                { href: '/about',    label: 'À propos' },
                { href: '/blog',     label: 'Blog' },
                { href: '/contact',  label: 'Contact' },
              ].map(({ href, label }, i) => (
                <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.05 }}>
                  <Link href={href} onClick={() => setMobileOpen(false)}
                    className={`block py-3 text-[22px] font-bold tracking-tight transition-colors ${isActive(href) ? 'text-white' : 'text-white/35 hover:text-white/80'}`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="mt-8 pt-8 border-t border-white/8 flex flex-col gap-3"
              >
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs font-black text-white">{firstName?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{firstName ?? 'Mon compte'}</p>
                        <p className="text-xs text-white/35">{user.email}</p>
                      </div>
                    </Link>
                    <button onClick={() => { setMobileOpen(false); handleLogout() }} className="text-left text-sm text-white/35 hover:text-red-400 transition-colors py-2">
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center py-3.5 rounded-xl bg-white text-gray-900 text-[15px] font-bold">
                      Commencer gratuitement
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm text-white/35 hover:text-white/60 transition-colors py-2">
                      Déjà un compte ? Se connecter
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
