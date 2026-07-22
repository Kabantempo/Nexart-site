export const REGIONS: Record<string, { name: string; lat: number; lng: number; code: string; villes: string[] }> = {
  'ile-de-france': {
    name: 'Île-de-France',
    lat: 48.8499,
    lng: 2.6370,
    code: 'FR-IDF',
    villes: ['Paris', 'Versailles', 'Boulogne-Billancourt', 'Saint-Denis', 'Montreuil'],
  },
  'auvergne-rhone-alpes': {
    name: 'Auvergne-Rhône-Alpes',
    lat: 45.7597,
    lng: 4.8422,
    code: 'FR-ARA',
    villes: ['Lyon', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand', 'Annecy', 'Chambéry'],
  },
  'nouvelle-aquitaine': {
    name: 'Nouvelle-Aquitaine',
    lat: 44.8378,
    lng: -0.5792,
    code: 'FR-NAQ',
    villes: ['Bordeaux', 'Limoges', 'Poitiers', 'Bayonne', 'Pau', 'Périgueux'],
  },
  occitanie: {
    name: 'Occitanie',
    lat: 43.6047,
    lng: 1.4442,
    code: 'FR-OCC',
    villes: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Narbonne', 'Albi'],
  },
  'hauts-de-france': {
    name: 'Hauts-de-France',
    lat: 50.4801,
    lng: 2.7937,
    code: 'FR-HDF',
    villes: ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Valenciennes'],
  },
  'grand-est': {
    name: 'Grand Est',
    lat: 48.5734,
    lng: 7.7521,
    code: 'FR-GES',
    villes: ['Strasbourg', 'Reims', 'Metz', 'Nancy', 'Mulhouse', 'Colmar'],
  },
  'provence-alpes-cote-d-azur': {
    name: "Provence-Alpes-Côte d'Azur",
    lat: 43.9352,
    lng: 6.0679,
    code: 'FR-PAC',
    villes: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Cannes'],
  },
  'pays-de-la-loire': {
    name: 'Pays de la Loire',
    lat: 47.7632,
    lng: -0.3299,
    code: 'FR-PDL',
    villes: ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'La Roche-sur-Yon'],
  },
  bretagne: {
    name: 'Bretagne',
    lat: 48.2020,
    lng: -2.9326,
    code: 'FR-BRE',
    villes: ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Saint-Malo'],
  },
  normandie: {
    name: 'Normandie',
    lat: 49.1829,
    lng: 0.3707,
    code: 'FR-NOR',
    villes: ['Rouen', 'Caen', 'Le Havre', 'Cherbourg', 'Évreux', 'Dieppe'],
  },
  bourgogne: {
    name: 'Bourgogne-Franche-Comté',
    lat: 47.2805,
    lng: 4.9994,
    code: 'FR-BFC',
    villes: ['Dijon', 'Besançon', 'Mâcon', 'Chalon-sur-Saône', 'Belfort'],
  },
  centre: {
    name: 'Centre-Val de Loire',
    lat: 47.7516,
    lng: 1.6751,
    code: 'FR-CVL',
    villes: ['Orléans', 'Tours', 'Bourges', 'Chartres', 'Blois'],
  },
  corse: {
    name: 'Corse',
    lat: 42.0396,
    lng: 9.0129,
    code: 'FR-COR',
    villes: ['Ajaccio', 'Bastia', 'Corte'],
  },
}

export function slugToRegion(slug: string) {
  return REGIONS[slug] ?? null
}

export function regionToSlug(regionName: string): string | null {
  const normalized = regionName.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const entry = Object.entries(REGIONS).find(([, r]) =>
    r.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === normalized
  )
  return entry?.[0] ?? null
}
