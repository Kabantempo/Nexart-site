import Link from 'next/link'

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center px-4">
      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 text-4xl">
          ⛔
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Compte suspendu</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Votre compte Nexart a été suspendu suite à une violation de nos conditions d'utilisation.
          Si vous pensez qu'il s'agit d'une erreur, contactez notre équipe.
        </p>
        <Link href="/contact"
          className="inline-flex px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
          Contacter le support
        </Link>
      </div>
    </div>
  )
}
