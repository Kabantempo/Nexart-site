'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-sm shadow-sm"
    >
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#6366F1]">
            Nexart
          </Link>

          <div className="hidden gap-8 md:flex">
            <Link href="/creators" className="text-sm text-[#888888] hover:text-[#6366F1] transition">
              Créateurs
            </Link>
            <Link href="/events" className="text-sm text-[#888888] hover:text-[#6366F1] transition">
              Événements
            </Link>
            <Link href="/about" className="text-sm text-[#888888] hover:text-[#6366F1] transition">
              À propos
            </Link>
          </div>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-[#888888] hover:text-[#6366F1] transition"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5B5BD6] transition"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
