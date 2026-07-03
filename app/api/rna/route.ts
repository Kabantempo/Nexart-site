import { NextRequest, NextResponse } from 'next/server'

// Verification RNA (associations loi 1901)
// Format : W suivi de 9 chiffres
export async function GET(req: NextRequest) {
  const rna = req.nextUrl.searchParams.get('rna')?.replace(/\s/g, '').toUpperCase()

  if (!rna || !/^W\d{9}$/.test(rna)) {
    return NextResponse.json({ error: 'Numéro RNA invalide (format : W suivi de 9 chiffres)' }, { status: 400 })
  }

  try {
    // API data.gouv.fr — répertoire national des associations
    const res = await fetch(
      `https://api.gouv.fr/api/rna/v1/full_text/${rna}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
    )

    // Fallback : API associations.data.gouv.fr
    if (!res.ok) {
      const res2 = await fetch(
        `https://api-association.data.gouv.fr/association/${rna}`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
      )

      if (res2.status === 404) {
        return NextResponse.json({ error: 'Association introuvable dans le répertoire RNA' }, { status: 404 })
      }
      if (!res2.ok) {
        return NextResponse.json({ error: 'Erreur API RNA' }, { status: res2.status })
      }

      const data2 = await res2.json()
      return NextResponse.json({
        valid: true,
        nom: data2.titre || data2.nom_complet || 'Association',
        rna,
        adresse: data2.adresse_siege_social || null,
        date_creation: data2.date_creation || null,
        active: data2.etat_administratif !== 'D',
      })
    }

    const data = await res.json()
    const asso = data.association || data

    return NextResponse.json({
      valid: true,
      nom: asso.titre || asso.nom_complet || 'Association',
      rna,
      adresse: asso.adresse_siege_social || null,
      date_creation: asso.date_creation || null,
      active: asso.etat_administratif !== 'D',
    })
  } catch {
    return NextResponse.json({ error: 'Impossible de contacter le service RNA' }, { status: 503 })
  }
}
