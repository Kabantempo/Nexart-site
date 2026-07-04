import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="text-[120px] font-black leading-none mb-4"
          style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Page non trouvée</h1>
        <p className="text-white/40 text-base mb-10 leading-relaxed">
          La page que vous cherchez n'existe pas ou a été supprimée.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
          <Link href="/"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
            ← Retour à l'accueil
          </Link>
          <Link href="/events"
            className="px-6 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-semibold hover:border-white/30 hover:text-white/80 transition-all">
            Voir les événements →
          </Link>
        </div>

        <p className="text-white/20 text-xs">
          Besoin d'aide ?{' '}
          <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">Contactez-nous</Link>
        </p>
      </div>
    </div>
  )
}
