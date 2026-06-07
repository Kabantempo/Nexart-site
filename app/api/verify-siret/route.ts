import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const siret = req.nextUrl.searchParams.get('siret')?.replace(/\s/g, '')

  if (!siret || siret.length !== 14 || !/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: 'SIRET invalide (14 chiffres requis)' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.annuaire-entreprises.data.gouv.fr/api/v3/etablissement/${siret}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
    )

    if (res.status === 404) {
      return NextResponse.json({ error: 'SIRET introuvable dans le répertoire Sirene' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Erreur API INSEE' }, { status: res.status })
    }

    const data = await res.json()
    const nom = data.unite_legale?.nom_complet
      ?? data.unite_legale?.personne_morale_attributs?.raison_sociale
      ?? data.unite_legale?.personne_physique_attributs?.nom_naissance
      ?? 'Entreprise'
    const statut = data.etat_administratif // 'A' = actif, 'F' = fermé

    if (statut === 'F') {
      return NextResponse.json({ error: 'Cet établissement est fermé (SIRET radié)' }, { status: 422 })
    }

    return NextResponse.json({
      valid: true,
      nom,
      siret,
      adresse: data.adresse_complete ?? null,
      activite: data.activite_principale ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Impossible de contacter le service INSEE' }, { status: 503 })
  }
}
