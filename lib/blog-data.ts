export type Article = {
  id: string
  title: string
  excerpt: string
  category: 'créateurs' | 'organisateurs' | 'actualités'
  readTime: number
  date: string
  slug: string
  gradient: string
  icon: string
  tags: string[]
  content: string
  image?: string
}

export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Comment préparer son stand pour un marché artisanal',
    excerpt: 'De la scénographie à la signalétique, tout ce qu\'il faut savoir pour attirer le chaland et maximiser vos ventes le jour J.',
    category: 'créateurs',
    readTime: 7,
    date: '2026-06-01',
    slug: 'preparer-stand-marche',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    icon: '🏕️',
    tags: ['Stand', 'Merchandising', 'Conseils'],
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=630&fit=crop',
    content: `
<p>La préparation d'un stand de marché artisanal va bien au-delà de disposer ses créations sur une table. C'est une véritable mise en scène qui influence directement vos ventes et l'image que vous renvoyez. Voici une méthode complète pour arriver le jour J avec un stand impeccable.</p>

<h2>Soigner la scénographie et l'identité visuelle</h2>
<p>Votre stand est votre boutique éphémère. En quelques secondes, les visiteurs décident s'ils s'arrêtent ou non. Pour capter l'attention :</p>
<ul>
  <li><strong>Jouez sur la hauteur</strong> : étagères, présentoirs, trépieds créent du volume et de la profondeur.</li>
  <li><strong>Uniformisez les supports</strong> : des caisses en bois, du lin naturel ou des supports en métal noir donnent une cohérence immédiate.</li>
  <li><strong>Limitez les couleurs</strong> : 2-3 tons maximum pour que vos créations restent au premier plan.</li>
</ul>

<h2>Travailler la signalétique</h2>
<p>Un visiteur ne devrait jamais avoir à demander "vous faites quoi ?" en passant devant votre stand. Prévoyez :</p>
<ul>
  <li>Un panneau avec votre nom/marque, clairement lisible à 3 mètres</li>
  <li>Des étiquettes avec le prix <strong>et</strong> le matériau ou l'histoire de l'objet</li>
  <li>Un petit QR code vers votre profil Nexart ou Instagram</li>
</ul>
<p>Les prix affichés réduisent l'hésitation et les questions répétitives. Ne les cachez pas par peur.</p>

<h2>Optimiser l'espace et la circulation</h2>
<p>Un stand encombré inhibe l'achat. Quelques règles pratiques :</p>
<ul>
  <li><strong>Gardez un espace de circulation</strong> : si c'est possible, créez un "L" ou un "U" plutôt qu'une table frontale.</li>
  <li><strong>Mettez vos bestsellers en avant</strong> : placez à hauteur des yeux ce que vous vendez le mieux ou ce qui a le prix d'appel le plus fort.</li>
  <li><strong>Racontez une histoire</strong> : un atelier miniature, quelques outils, une photo en train de travailler — tout ce qui montre le savoir-faire derrière l'objet augmente la perception de valeur.</li>
</ul>

<h2>Préparation logistique le jour J</h2>
<p>La meilleure scénographie ne sert à rien si vous arrivez stressé et en retard. Préparez une checklist la veille :</p>
<ul>
  <li>Stock suffisant + réserve cachée sous la table</li>
  <li>Terminal de paiement chargé (Sumup, iZettle…)</li>
  <li>Monnaie en caisse (minimum 80-100€ en petites coupures)</li>
  <li>Sacs, papier de soie, boîtes pour les achats</li>
  <li>Cartes de visite ou flyers</li>
  <li>Bouteille d'eau et snacks — une journée de marché dure 6 à 8 heures</li>
</ul>

<h2>L'attitude, dernier ingrédient essentiel</h2>
<p>Un stand parfait avec un artisan qui évite le regard des passants ne convertit pas. Levez les yeux, souriez, proposez d'essayer. Pas besoin de "vendre" : simplement accueillir et expliquer votre démarche suffit souvent à déclencher l'achat.</p>
<p>Avec Nexart, votre profil créateur vous permet de mettre en avant vos photos de stand et de portfolio. Profitez du marché pour prendre des photos avec un bon éclairage naturel — elles seront vos meilleurs arguments pour les prochaines candidatures.</p>
    `,
  },
  {
    id: '2',
    title: 'Fixer ses prix en tant qu\'artisan : la méthode complète',
    excerpt: 'Coût matière, temps de travail, valeur perçue… Apprenez à calculer des prix justes qui valorisent votre savoir-faire sans faire fuir les acheteurs.',
    category: 'créateurs',
    readTime: 9,
    date: '2026-05-24',
    slug: 'fixer-ses-prix-artisan',
    gradient: 'linear-gradient(135deg, #C9A84C 0%, #E8C56A 100%)',
    icon: '💰',
    tags: ['Tarification', 'Gestion', 'Business'],
    image: 'https://images.unsplash.com/photo-1526628652108-aa545b6c60f0?w=1200&h=630&fit=crop',
    content: `
<p>Fixer ses prix est l'une des étapes les plus délicates pour un artisan. Trop bas, vous dévaluez votre savoir-faire et travaillez à perte. Trop haut sans justification visible, vous perdez des ventes. Voici une méthode structurée pour trouver le juste équilibre.</p>

<h2>Calculer le coût de revient réel</h2>
<p>Commencez par poser les chiffres sur la table. Pour chaque création, listez :</p>
<ul>
  <li><strong>Matières premières</strong> : coût exact des matériaux utilisés, au prorata de la quantité</li>
  <li><strong>Emballage</strong> : boîte, papier de soie, ruban, sachets</li>
  <li><strong>Frais indirects</strong> : outillage amorti, consommables, électricité de l'atelier</li>
  <li><strong>Frais de participation</strong> : droits de place du marché divisés par le nombre de pièces vendues en moyenne</li>
</ul>

<h2>Valoriser votre temps de travail</h2>
<p>C'est l'erreur la plus fréquente : les artisans oublient de se payer. Définissez un taux horaire — au minimum le SMIC artisanal (environ 12-13€/h) mais visez davantage si vous avez de l'expérience. Multipliez par le temps exact de fabrication, <strong>atelier de prototypage compris</strong>.</p>
<p>Un bijou qui prend 3h à fabriquer avec 8€ de matière = prix de revient de 47€ minimum au SMIC. Votre prix de vente ne peut pas être en dessous.</p>

<h2>Intégrer la valeur perçue</h2>
<p>Le prix psychologique n'est pas une formule, c'est une lecture du marché. Pour estimer votre valeur perçue :</p>
<ul>
  <li>Regardez ce que pratiquent des créateurs avec un niveau comparable sur Etsy, Instagram et Nexart</li>
  <li>Tenez compte de votre <strong>singularité</strong> : une technique rare, un matériau local, une démarche éco-responsable justifient un prix premium</li>
  <li>Testez : si vous vendez tout le premier jour, c'est que vous êtes trop bas</li>
</ul>

<h2>Appliquer une marge commerciale</h2>
<p>Une fois le coût de revient connu, appliquez un coefficient. En artisanat, un multiplicateur de <strong>2,5 à 3,5</strong> est courant :</p>
<ul>
  <li>Coût de revient × 2,5 = prix minimum viable</li>
  <li>Coût de revient × 3,5 = prix avec marge saine pour les imprévus et la croissance</li>
</ul>
<p>N'oubliez pas : si vous vendez aussi en boutique ou via un revendeur, ils prendront 30 à 50 %. Votre prix public doit l'absorber.</p>

<h2>Erreurs classiques à éviter</h2>
<ul>
  <li><strong>Baisser ses prix pour s'aligner sur la grande distribution</strong> : vous ne pouvez pas gagner cette bataille. Gagnez celle de la valeur.</li>
  <li><strong>Ne jamais revaloriser</strong> : révisez vos prix chaque année, notamment si le coût des matières a augmenté.</li>
  <li><strong>Mélanger les gammes sans logique</strong> : un stand avec des pièces à 5€ et d'autres à 300€ sans hiérarchie visuelle crée de la confusion.</li>
</ul>
<p>Sur Nexart, votre profil vous permet d'afficher votre gamme de prix dans votre bio créateur. C'est un filtre implicite qui attire les organisateurs qui ont le bon budget pour votre positionnement.</p>
    `,
  },
  {
    id: '3',
    title: 'Photographier votre travail pour décrocher les meilleurs marchés',
    excerpt: 'Les organisateurs reçoivent des dizaines de candidatures. Des photos professionnelles peuvent faire toute la différence. Nos astuces pour briller.',
    category: 'créateurs',
    readTime: 6,
    date: '2026-05-15',
    slug: 'photographier-travail-artisan',
    gradient: 'linear-gradient(135deg, #7A9E87 0%, #5A8E75 100%)',
    icon: '📸',
    tags: ['Photographie', 'Portfolio', 'Candidature'],
    image: 'https://images.unsplash.com/photo-1600080869266-f12707903a0f?w=1200&h=630&fit=crop',
    content: `
<p>Dans un dossier de candidature à un marché, vos photos parlent avant vous. Un organisateur qui reçoit 50 demandes pour 10 stands sélectionne d'abord visuellement. Voici comment produire des images qui font la différence.</p>

<h2>L'équipement n'est pas une excuse</h2>
<p>Un iPhone récent ou un Android milieu de gamme suffit amplement. Ce qui compte, c'est la lumière et la composition, pas les mégapixels. Évitez le flash intégré à tout prix — il aplatit les textures et crée des reflets disgracieux.</p>

<h2>Maîtriser la lumière naturelle</h2>
<p>La lumière naturelle indirecte est votre meilleure alliée :</p>
<ul>
  <li>Photographiez près d'une fenêtre orientée nord ou à l'ombre, sans soleil direct</li>
  <li>Le matin entre 8h et 10h ou en fin d'après-midi donne une lumière douce et chaude</li>
  <li>Utilisez un fond blanc (feuille A3, tissu lin, bois clair) pour isoler la pièce</li>
</ul>
<p>Une lumière diffuse depuis la gauche avec un réflecteur blanc (carton plié en deux) à droite est la configuration la plus polyvalente.</p>

<h2>Composer pour mettre en valeur</h2>
<ul>
  <li><strong>Règle des tiers</strong> : placez votre pièce légèrement décentrée plutôt qu'exactement au milieu</li>
  <li><strong>Variez les angles</strong> : face, 3/4, dessus, détail — 4 vues minimum par pièce importante</li>
  <li><strong>Ajoutez du contexte</strong> : un bracelet porté, une céramique avec du café dedans, un livre ouvert à côté d'une reliure — montrez l'usage</li>
  <li><strong>Fonds cohérents</strong> : choisissez 2-3 fonds qui correspondent à votre univers et utilisez-les de façon constante</li>
</ul>

<h2>La retouche essentielle (sans en faire trop)</h2>
<p>Lightroom Mobile (gratuit) ou Snapseed suffisent. Ajustez uniquement :</p>
<ul>
  <li>Exposition (+0,3 à +0,7 pour compenser les photos légèrement sombres)</li>
  <li>Blanc et noir pour la température de couleur</li>
  <li>Clarté légèrement positive pour faire ressortir les textures</li>
</ul>
<p>Évitez les filtres Instagram trop marqués — ils vieillissent vite et ne servent pas le professionnalisme.</p>

<h2>Construire un portfolio cohérent</h2>
<p>Sur Nexart, votre grille portfolio est la première impression que vous laissez aux organisateurs. Visez :</p>
<ul>
  <li>8 à 12 photos homogènes en termes de style et de lumière</li>
  <li>Un mélange de vues d'ensemble et de détails</li>
  <li>Au moins une photo de vous en train de travailler dans votre atelier</li>
</ul>
<p>Renouvelez vos photos chaque saison pour montrer que vous êtes actif et que votre travail évolue. Les organisateurs regardent la régularité.</p>
    `,
  },
  {
    id: '4',
    title: 'Les 10 marchés artisanaux incontournables en France en 2026',
    excerpt: 'Du Marché de Noël de Strasbourg aux pop-ups parisiens, notre sélection des événements à ne pas manquer cette année pour exposer vos créations.',
    category: 'créateurs',
    readTime: 5,
    date: '2026-05-10',
    slug: 'top-marches-artisanaux-2026',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
    icon: '🗺️',
    tags: ['Sélection', 'France', '2026'],
    image: 'https://images.unsplash.com/photo-1552668473-d5b604d0c90d?w=1200&h=630&fit=crop',
    content: `
<p>La France compte plusieurs centaines de marchés artisanaux chaque année. Parmi eux, certains se distinguent par leur sélectivité, leur fréquentation et les opportunités qu'ils représentent pour les créateurs. Voici notre sélection 2026.</p>

<h2>Les incontournables nationaux</h2>

<h3>1. Marché de Noël de Strasbourg</h3>
<p>Le plus ancien d'Europe (depuis 1570), il attire plus de 2 millions de visiteurs sur 4 semaines. Sélection très stricte mais une vitrine unique. Dossier à déposer avant juillet.</p>

<h3>2. Marché des Créateurs de Lyon</h3>
<p>Événement mensuel place du Marché Saint-Paul. Ambiance chaleureuse, clientèle fidèle et pouvoir d'achat élevé. Idéal pour les créateurs débutants grâce aux tarifs accessibles.</p>

<h3>3. Salon Révélations (Grand Palais, Paris)</h3>
<p>La biennale internationale des métiers d'art. Prochaine édition en juin 2026. Prestige maximal, clientèle internationale de collectionneurs. Dossier technique exigeant.</p>

<h3>4. Marché de la Création de Paris (boulevard Edgar-Quinet)</h3>
<p>Chaque dimanche toute l'année. Un classique parisien avec 200 artisans et artistes. Format récurrent idéal pour tester son offre et ses prix.</p>

<h3>5. Les Artisans du Monde (Bordeaux)</h3>
<p>Festival annuel sur les quais, 3 jours en mai. Fort trafic touristique en plus des locaux. Les disciplines artisanales et créateurs issus du commerce équitable y sont particulièrement valorisés.</p>

<h2>Les événements régionaux à fort potentiel</h2>

<h3>6. Crafted (Nantes)</h3>
<p>Marché urbain "créateurs & makers" en plein essor. Clientèle jeune, curieuse, prête à découvrir. Parfait pour les disciplines contemporaines (céramique, illustration, textile naturel).</p>

<h3>7. Marché Provençal de Gordes</h3>
<p>Clientèle touristique internationale tout l'été. Panier moyen élevé. Les créateurs locaux (Provence-Alpes-Côte d'Azur) y ont une forte plus-value d'authenticité.</p>

<h3>8. Festival des Arts de la Rue (Aurillac)</h3>
<p>Événement atypique mêlant street art et artisanat. Fréquentation de 100 000 personnes sur 4 jours. Excellent pour les créateurs avec un positionnement décalé.</p>

<h3>9. Puces du Design (Lyon)</h3>
<p>Spécialisé mobilier et design vintage/contemporain. Les créateurs de mobilier, luminaires et céramique d'intérieur y trouvent leur public idéal.</p>

<h3>10. Marché de Noël de Mulhouse</h3>
<p>Alternative au marché de Strasbourg avec des droits de place plus accessibles et moins de candidatures. Clientèle transfrontalière franco-allemande.</p>

<h2>Trouver d'autres marchés avec Nexart</h2>
<p>Ces 10 événements ne sont que la surface visible. Des centaines de marchés de qualité, moins connus mais très rentables, sont organisés dans toute la France. Sur Nexart, vous pouvez explorer les événements publiés par les organisateurs, filtrer par région, date et type de discipline, et candidater directement depuis l'app.</p>
    `,
  },
  {
    id: '5',
    title: 'Attirer les meilleurs créateurs pour votre marché',
    excerpt: 'Une fiche événement bien rédigée, des disciplines ciblées, une communication soignée : voici comment rendre votre marché irrésistible pour les artisans.',
    category: 'organisateurs',
    readTime: 8,
    date: '2026-06-03',
    slug: 'attirer-createurs-marche',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
    icon: '🎯',
    tags: ['Recrutement', 'Communication', 'Fiche marché'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop',
    content: `
<p>Un marché artisanal réussi se construit d'abord sur la qualité des créateurs sélectionnés. Mais pour attirer les meilleurs — ceux qui ont le choix — votre événement doit se distinguer dès la fiche de présentation. Voici comment rendre votre marché irrésistible.</p>

<h2>Soigner votre fiche événement sur Nexart</h2>
<p>C'est votre vitrine. Un créateur qui découvre votre événement se forge une opinion en 30 secondes. Votre fiche doit répondre immédiatement à leurs questions clés :</p>
<ul>
  <li><strong>Emplacement exact</strong> : adresse, commune, accès transport</li>
  <li><strong>Dates et horaires</strong> : montage inclus</li>
  <li><strong>Trafic attendu</strong> : chiffres honnêtes de fréquentation si vous avez un historique</li>
  <li><strong>Prix du stand</strong> : toutes charges comprises, pas de mauvaises surprises</li>
  <li><strong>Disciplines recherchées</strong> : précis plutôt que générique</li>
</ul>
<p>Une fiche vague repousse les créateurs expérimentés. Soyez précis et transparent.</p>

<h2>Cibler les disciplines avec cohérence</h2>
<p>Un marché avec 3 bijoutiers et aucune céramiste, ou 10 illustrateurs côte à côte, ne fonctionne pas. Pensez à votre marché comme à une boutique éphémère :</p>
<ul>
  <li>Diversifiez les disciplines tout en maintenant un fil rouge thématique (naturel, contemporain, traditionnel…)</li>
  <li>Évitez les doublons exacts (2 créateurs de la même niche diminuent les ventes de chacun)</li>
  <li>Recherchez des créateurs complémentaires qui font monter le panier visiteur moyen</li>
</ul>

<h2>Construire une réputation d'organisateur fiable</h2>
<p>Les créateurs se parlent. Une mauvaise expérience se partage sur Instagram ou dans les groupes Facebook d'artisans. À l'inverse, une réputation d'organisateur sérieux attire les meilleurs profils automatiquement.</p>
<ul>
  <li>Répondez aux candidatures sous 5 jours ouvrés</li>
  <li>Envoyez un brief détaillé 2 semaines avant : plan du marché, parking, consignes montage</li>
  <li>Soyez présent sur place tout le marché</li>
  <li>Demandez un retour aux créateurs en fin d'événement</li>
</ul>

<h2>Communiquer pour générer du trafic</h2>
<p>Un stand vendu n'est que la première étape. Les créateurs reviennent l'année suivante si l'événement attire du monde. Votre rôle d'organisateur inclut la communication :</p>
<ul>
  <li>Page Facebook + Instagram dédiées à l'événement, actives plusieurs semaines avant</li>
  <li>Partenariats avec la presse locale et les offices de tourisme</li>
  <li>Mise en avant des créateurs participants (stories, reposts) — cela génère du trafic organique via leurs réseaux</li>
</ul>

<h2>Proposer des conditions attractives</h2>
<p>Au-delà du prix du stand, les créateurs sont sensibles à :</p>
<ul>
  <li>La qualité et la taille de l'emplacement</li>
  <li>L'accès électricité (indispensable pour certaines disciplines)</li>
  <li>Les services sur place : gardiennage la veille, café le matin, repas partagé</li>
  <li>La politique de remboursement en cas d'annulation météo</li>
</ul>
<p>Sur Nexart, votre profil organisateur affiche les avis laissés par les créateurs passés. C'est votre meilleur argument commercial — soignez chaque édition.</p>
    `,
  },
  {
    id: '6',
    title: 'Gérer les candidatures : bonnes pratiques et pièges à éviter',
    excerpt: 'Répondre rapidement, donner un retour constructif, sélectionner avec équité… Un guide pour les organisateurs qui veulent fidéliser les artisans.',
    category: 'organisateurs',
    readTime: 6,
    date: '2026-05-28',
    slug: 'gerer-candidatures-organisateur',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    icon: '📋',
    tags: ['Candidatures', 'Process', 'Relation artisans'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop',
    content: `
<p>Recevoir des candidatures, c'est la bonne nouvelle. Les gérer mal, c'est gâcher l'opportunité et entacher votre réputation d'organisateur. Voici un guide pratique pour traiter les dossiers efficacement et maintenir de bonnes relations avec les artisans.</p>

<h2>Définir vos critères avant d'ouvrir les candidatures</h2>
<p>Impossible de sélectionner de façon cohérente si vous n'avez pas défini en amont :</p>
<ul>
  <li>Les disciplines que vous recherchez et en quelle proportion</li>
  <li>Le niveau de qualité attendu (artisanat premier prix, milieu de gamme, premium)</li>
  <li>Les créateurs locaux ont-ils une priorité ?</li>
  <li>Acceptez-vous les revendeurs ou uniquement les créateurs-fabricants ?</li>
</ul>
<p>Ces critères doivent être visibles sur votre fiche événement pour éviter les candidatures non pertinentes.</p>

<h2>Mettre en place un process de sélection</h2>
<p>Avec 50 à 100 candidatures pour 20 stands, improviser n'est pas une option :</p>
<ul>
  <li><strong>Pré-sélection rapide (J+2)</strong> : élimination des dossiers incomplets ou hors discipline</li>
  <li><strong>Grille de notation</strong> : qualité des photos, cohérence du profil, tarif stand adapté</li>
  <li><strong>Décision finale (J+7)</strong> : construire le "plateau" équilibré</li>
</ul>
<p>Sur Nexart, vous pouvez directement accepter ou refuser les candidatures depuis votre tableau de bord, avec un message personnalisé.</p>

<h2>Communiquer rapidement et honnêtement</h2>
<p>La pire chose que vous puissiez faire : ne pas répondre. Un créateur qui attend une réponse ne peut pas postuler ailleurs.</p>
<ul>
  <li>Accusez réception de chaque candidature sous 48h</li>
  <li>Donnez une date de réponse et respectez-la</li>
  <li>Les refus méritent un mot : "votre discipline est déjà pourvue" ou "le niveau de finition ne correspond pas à notre sélection" aide les candidats à s'améliorer</li>
</ul>

<h2>Éviter les pièges courants</h2>
<ul>
  <li><strong>Accepter trop tôt</strong> : si vous acceptez les 10 premiers et que les meilleurs candidats arrivent ensuite, vous serez coincé</li>
  <li><strong>Promettre sans confirmer</strong> : "vous êtes sur liste d'attente" sans mise à jour est frustrant</li>
  <li><strong>Modifier les conditions après acceptation</strong> : prix du stand, emplacement, surface — toujours confirmer par écrit</li>
  <li><strong>Oublier les listes d'attente</strong> : les désistements arrivent, avoir 3-4 remplaçants prêts évite les trous</li>
</ul>

<h2>Fidéliser les créateurs</h2>
<p>Les meilleurs créateurs ont plusieurs options chaque week-end. Pour qu'ils reviennent :</p>
<ul>
  <li>Demandez leur avis après chaque édition et montrez que vous en tenez compte</li>
  <li>Proposez une priorité de réinscription aux fidèles</li>
  <li>Partagez les données de fréquentation — c'est une preuve de transparence appréciée</li>
</ul>
<p>Un réseau de créateurs fidèles est l'actif le plus précieux d'un organisateur. Nexart facilite le suivi des relations et la communication avec vos créateurs habituels.</p>
    `,
  },
  {
    id: '7',
    title: 'Créer une ambiance mémorable : scénographie et expérience visiteur',
    excerpt: 'Lumières, signalétique, musique, restauration… Les marchés qui cartonnent pensent à chaque détail. Inspirez-vous des meilleures pratiques.',
    category: 'organisateurs',
    readTime: 7,
    date: '2026-05-18',
    slug: 'ambiance-marche-scenographie',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    icon: '✨',
    tags: ['Scénographie', 'Expérience', 'Événementiel'],
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=630&fit=crop',
    content: `
<p>Les marchés artisanaux qui fidélisent leur public et font parler d'eux ont un point commun : ils ne sont pas juste un alignement de stands. Ce sont des expériences. Voici comment créer une ambiance mémorable qui donne envie de revenir — et de partager.</p>

<h2>L'identité visuelle de l'événement</h2>
<p>Avant même que les visiteurs arrivent, votre marché a une image. Travaillez-la :</p>
<ul>
  <li><strong>Signalétique cohérente</strong> : fléchage d'accès, banderoles d'entrée, numérotation des stands — tout doit être uniforme</li>
  <li><strong>Palette de couleurs</strong> : décorations, nappes de table partagées, ballons ou drapeaux dans vos couleurs créent un sentiment d'appartenance</li>
  <li><strong>Photo spot instagrammable</strong> : un mur végétal, une arche fleurie, un décor thématique — offrez aux visiteurs un endroit où se prendre en photo avec votre branding</li>
</ul>

<h2>L'éclairage, nerf de la guerre</h2>
<p>Un marché extérieur de jour bénéficie de la lumière naturelle, mais si vous avez un marché en halle ou en soirée :</p>
<ul>
  <li>Des guirlandes lumineuses créent instantanément une atmosphère chaleureuse</li>
  <li>Chaque stand devrait avoir accès à l'électricité pour ses propres spots</li>
  <li>Évitez les néons blancs froids — ils dévalorisent les créations artisanales</li>
</ul>

<h2>La musique et les animations</h2>
<p>Le silence est gênant, le volume trop fort est repoussant. L'objectif est un fond sonore qui donne envie de flâner :</p>
<ul>
  <li>Acoustic, jazz ou folk doux selon l'ambiance recherchée</li>
  <li>Volume à -6dB pour permettre les conversations naturelles</li>
  <li>Programmez des animations ponctuelles : démonstration d'artisan en direct, atelier pour enfants, DJ set en fin de journée pour un marché nocturne</li>
</ul>

<h2>La restauration comme ancre</h2>
<p>Les visiteurs restent plus longtemps quand ils peuvent manger et boire sur place. Cela augmente mécaniquement les achats :</p>
<ul>
  <li>Un food truck thématique (traiteur local, boissons artisanales) valorise l'ensemble</li>
  <li>Quelques tables et chaises donnent aux visiteurs un endroit pour souffler et observer</li>
  <li>La restauration peut être une source de revenus complémentaires via un droit de place dédié</li>
</ul>

<h2>L'accessibilité et le confort</h2>
<p>L'expérience se pense aussi de façon pratique :</p>
<ul>
  <li>Accès poussette et PMR si possible</li>
  <li>Parkings indiqués sur les communications</li>
  <li>Toilettes propres et accessibles — sous-estimé mais décisif</li>
  <li>Zone d'ombre ou protection de la pluie selon la saison</li>
</ul>

<h2>L'après-marché sur les réseaux</h2>
<p>Un bon marché continue de vivre sur Instagram après sa clôture. Encouragez les créateurs et les visiteurs à poster en :</p>
<ul>
  <li>Créant un hashtag dédié et l'affichant à l'entrée</li>
  <li>Republiant les stories des participants sur le compte de l'événement</li>
  <li>Publiant un bilan photo professionnel le lendemain</li>
</ul>
<p>Les photos de votre édition précédente sont votre argument numéro 1 pour attirer plus de monde à la prochaine. Investissez dans un photographe ou désignez quelqu'un en charge de la documentation.</p>
    `,
  },
  {
    id: '8',
    title: 'Nexart lance la vérification SIRET et RC Pro',
    excerpt: 'Pour renforcer la confiance sur la plateforme, Nexart introduit un système de badges "Créateur vérifié". Explications sur la démarche et ses avantages.',
    category: 'actualités',
    readTime: 3,
    date: '2026-06-06',
    slug: 'nexart-verification-siret-rc-pro',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    icon: '🛡️',
    tags: ['Plateforme', 'Vérification', 'Confiance'],
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b83ad45?w=1200&h=630&fit=crop',
    content: `
<p>Dès ce mois de juin 2026, Nexart introduit un système de badges de vérification pour les créateurs inscrits sur la plateforme. Voici ce que ça change concrètement pour vous.</p>

<h2>Pourquoi nous lançons ces badges</h2>
<p>La confiance est le socle de toute relation commerciale. Sur Nexart, les organisateurs de marchés prennent un risque en acceptant un créateur qu'ils ne connaissent pas. Jusqu'ici, ils n'avaient que les photos et la bio pour se décider. Désormais, deux niveaux de vérification attestent du sérieux professionnel d'un créateur.</p>

<h2>Le badge "SIRET vérifié"</h2>
<p>Pour obtenir ce badge, le créateur télécharge un extrait Kbis ou un avis de situation SIRENE depuis son profil Nexart. Notre équipe vérifie que l'entreprise est active et que l'activité artisanale correspond. Ce badge confirme que le créateur exerce légalement son activité.</p>
<ul>
  <li>Délai de vérification : 24 à 72h ouvrées</li>
  <li>Valable 1 an, puis renouvellement demandé</li>
</ul>

<h2>Le badge "RC Pro vérifiée"</h2>
<p>La Responsabilité Civile Professionnelle est obligatoire pour participer à la plupart des marchés. Ce badge confirme que le créateur est assuré et que sa police est à jour. Il télécharge son attestation, nous vérifions la date de validité.</p>
<ul>
  <li>Requis par de nombreux organisateurs comme condition sine qua non</li>
  <li>Renouvelé automatiquement à chaque nouvelle attestation uploadée</li>
</ul>

<h2>Ce que ça change pour vous</h2>
<p><strong>Pour les créateurs :</strong> votre profil affiche clairement votre statut. Les organisateurs qui filtrent sur ces critères vous verront en priorité. Cela réduit les échanges de mails redondants pour demander vos justificatifs.</p>
<p><strong>Pour les organisateurs :</strong> vous pouvez filtrer les candidatures par niveau de vérification. Plus de temps passé à demander des documents — la vérification est déjà faite.</p>

<h2>Comment activer les vérifications</h2>
<p>Rendez-vous dans votre profil Nexart, onglet "Vérifications". Téléchargez les documents demandés et attendez la notification de validation. En cas de refus (document illisible, date expirée), vous êtes notifié avec la marche à suivre.</p>
<p>Ces vérifications restent facultatives mais fortement recommandées — elles font partie des critères de sélection d'un nombre croissant d'organisateurs sur la plateforme.</p>
    `,
  },
  {
    id: '9',
    title: 'Tendances artisanales 2026 : ce que recherchent les acheteurs',
    excerpt: 'Céramique organique, bijoux minimalistes, textiles naturels… Notre analyse des tendances qui cartonnent dans les marchés et salons cette année.',
    category: 'actualités',
    readTime: 5,
    date: '2026-05-05',
    slug: 'tendances-artisanales-2026',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    icon: '📈',
    tags: ['Tendances', 'Marché', '2026'],
    image: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=1200&h=630&fit=crop',
    content: `
<p>Chaque année, les goûts du public évoluent. Pour un artisan ou un organisateur, comprendre ces tendances permet d'anticiper la demande, d'affiner son offre et de sélectionner les créateurs qui vont faire briller un marché. Voici ce qui cartonne en 2026.</p>

<h2>Le retour à la matière et au local</h2>
<p>Après des années de minimalisme nordique, 2026 marque un retour fort aux textures brutes, aux matières naturelles et aux savoir-faire géographiquement identifiés. Ce que les acheteurs recherchent :</p>
<ul>
  <li><strong>Céramique organique</strong> : formes irrégulières, glaçures naturelles, collections en terre de Vallauris ou argile locale</li>
  <li><strong>Textiles naturels</strong> : lin, chanvre, laine mérinos non teintée ou teinte à la plante</li>
  <li><strong>Bois massif local</strong> : hêtre, noyer, châtaignier — avec mention de la forêt d'origine</li>
</ul>

<h2>Bijoux : minimalisme et pièces uniques</h2>
<p>Le marché du bijou artisanal continue de se porter fort, porté par le rejet des bijoux de grande distribution. Deux tendances coexistent :</p>
<ul>
  <li><strong>Minimaliste géométrique</strong> : argent sterling, laiton brut, pierres brutes dans des montures épurées</li>
  <li><strong>Pièces narratives</strong> : bijoux avec une histoire (métal récupéré, pierre locale, gravure personnalisée)</li>
</ul>
<p>Les acheteurs de 25-45 ans sont prêts à mettre 80-200€ dans un bijou s'il raconte quelque chose. C'est le sweet spot le plus actif du marché.</p>

<h2>L'art de vivre durable</h2>
<p>La maison reste le premier poste de dépense artisanale. En 2026, la demande est forte pour :</p>
<ul>
  <li>Bougies à la cire végétale avec senteurs naturelles et packaging zéro déchet</li>
  <li>Savons surgras et cosmétiques solides — le marché de la beauté naturelle explose</li>
  <li>Objets de table hybrides (céramique + bois, liège + métal)</li>
</ul>

<h2>L'illustration et l'art accessible</h2>
<p>Les prints, affiches et cartes illustrées connaissent une croissance continue. Le public cherche à décorer ses intérieurs avec des œuvres abordables (15-60€) et à soutenir directement un artiste. Les marchés qui intègrent des illustrateurs augmentent leur attractivité pour un public jeune urbain.</p>

<h2>Ce que les acheteurs attendent désormais</h2>
<p>Au-delà du produit lui-même, les comportements d'achat ont changé. Ce qui fait pencher la décision en 2026 :</p>
<ul>
  <li><strong>La transparence sur la fabrication</strong> : d'où vient la matière, combien de temps a-t-il fallu ?</li>
  <li><strong>La disponibilité en ligne</strong> : un profil Instagram actif ou une boutique Etsy rassure et prolonge la relation après le marché</li>
  <li><strong>La personnalisation</strong> : proposer des pièces sur-mesure, même à petit prix, est un différenciateur fort</li>
</ul>
<p>Sur Nexart, les créateurs qui renseignent leurs disciplines avec précision dans leur profil apparaissent dans les recherches des organisateurs qui cherchent à répondre exactement à ces tendances. Mettez à jour votre fiche si votre travail a évolué cette année.</p>
    `,
  },
]
