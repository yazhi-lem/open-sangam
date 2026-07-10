/**
 * knowledge.js — Sangam Knowledge Encyclopedia (அறிவுக்களஞ்சியம்)
 *
 * A topical, illustrated reference layer for the Sangam age — inspired by the
 * "knowledge with images" heritage indices, but grounded in Open Sangam's own
 * corpus so every topic can eventually deep-link to the verses that attest it.
 *
 * Structure: SECTIONS[] → each section has cards (items) rendered as an
 * illustrated grid. Emoji stand in for illustrations until licensed imagery is
 * sourced (see docs/data-collection-plan.md §Knowledge Entities).
 *
 * Sources: Tolkāppiyam (Poruḷatikāram) · Puṟanāṉūṟu · Naṟṟiṇai · Akanāṉūṟu ·
 * Kuṟuntokai · Patiṟṟuppattu · U.V. Swaminatha Iyer editions · standard
 * scholarship (Zvelebil, Hart, Ramanujan). Contested points are labelled.
 */

export const KNOWLEDGE_SECTIONS = [
  // ───────────────────────────────────────────────────────────── overview ──
  {
    id: 'age',
    ta: 'சங்க காலம்',
    en: 'The Sangam Age',
    icon: '📜',
    intro:
      'The classical Tamil corpus was composed roughly between 300 BCE and 300 CE by hundreds of poets across the Tamil country. Tradition holds it was gathered in three academies (Sangams) of poets and grammarians patronised by the Pāṇḍiya kings of Madurai.',
    items: [
      {
        emoji: '🏛',
        ta: 'மூன்று சங்கம்',
        en: 'The Three Sangams',
        desc: 'Legend (from the Iṟaiyaṉār Akapporuḷ commentary) counts three academies: the First at Then-Madurai and the Second at Kapāṭapuram — both said to be lost to the sea — and the Third at present-day Madurai, whose works survive. Treated as tradition, not dated history.',
      },
      {
        emoji: '📚',
        ta: 'பதினெண்மேற்கணக்கு',
        en: 'The Eighteen Greater Texts',
        desc: 'The surviving Sangam corpus: Eṭṭuttokai (Eight Anthologies) + Pattuppāṭṭu (Ten Idylls). A companion later set, the Padineṇkīḻkaṇakku (Eighteen Lesser Texts, incl. the Tirukkuṟaḷ), belongs to the post-Sangam didactic age.',
      },
      {
        emoji: '✍️',
        ta: 'தொல்காப்பியம்',
        en: 'Tolkāppiyam',
        desc: 'The oldest Tamil grammar and poetics, in three books — Eḻuttu (orthography), Sol (morphology) and Poruḷ (subject matter). Its Poruḷatikāram codifies the akam / puṟam division and the tiṇai landscape system that governs all Sangam poetry.',
      },
      {
        emoji: '🌏',
        ta: 'யாதும் ஊரே',
        en: 'One World, One Kin',
        desc: 'Kaṇiyan Pūṅkuṉṟaṉār\'s Puṟanāṉūṟu 192 — "yātum ūrē yāvarum kēḷir" (every town is my town, every man my kin) — distils the Sangam ethic of shared humanity, and is among the most-quoted lines of ancient Tamil.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── akam/puram ──
  {
    id: 'akam-puram',
    ta: 'அகமும் புறமும்',
    en: 'Akam & Puṟam — The Two Halves',
    icon: '❤️',
    intro:
      'Every Sangam poem is either akam (இன்/interior — the private world of love, unnamed lovers) or puṟam (out/exterior — the public world of kings, war, ethics and death). Roughly three-quarters of the corpus is akam.',
    items: [
      {
        emoji: '🌸',
        ta: 'அகம்',
        en: 'Akam — the Interior',
        desc: 'Love poetry set among nameless, universal characters (hero, heroine, friend, foster-mother, bard). The emotion is mapped onto one of five landscapes (aintiṇai). Chief works: Kuṟuntokai, Naṟṟiṇai, Akanāṉūṟu, Aiṅkuṟunūṟu, Kalittokai.',
      },
      {
        emoji: '⚔️',
        ta: 'புறம்',
        en: 'Puṟam — the Exterior',
        desc: 'Poetry of the public sphere — war, kingship, generosity, justice, and elegy — naming real kings, chieftains and poets. Chief works: Puṟanāṉūṟu, Patiṟṟuppattu, and the panegyric idylls of the Pattuppāṭṭu.',
      },
      {
        emoji: '🎭',
        ta: 'கைக்கிளை & பெருந்திணை',
        en: 'Kaikkiḷai & Peruntiṇai',
        desc: 'Beyond the five matched-love landscapes lie two "unfit" akam modes: kaikkiḷai (unreciprocated, one-sided love) and peruntiṇai (mismatched or excessive passion) — the boundaries of ideal Sangam love.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────── tinai system ──
  {
    id: 'tinai-porul',
    ta: 'திணைப் பொருள்',
    en: 'The Tiṇai Framework — Muthal · Karu · Uri',
    icon: '🗺',
    intro:
      'Tolkāppiyam builds each akam landscape (tiṇai) from three layers of "matter" (poruḷ): the setting, the native things, and the human mood proper to it. This is the deep grammar of Sangam imagery.',
    items: [
      {
        emoji: '🌅',
        ta: 'முதற்பொருள்',
        en: 'Muthal — First Things',
        desc: 'The stage itself: nilam (the land — one of the five tracts) and poḻutu (time — season + hour of day). Kuṟiñci\'s midnight and Mullai\'s rainy dusk are muthal poruḷ.',
      },
      {
        emoji: '🦚',
        ta: 'கருப்பொருள்',
        en: 'Karu — Native Things',
        desc: 'The intrinsic contents of each land: its god, people, food, beast, bird, drum, instrument, flower, tree and water. A poet signals a landscape simply by naming its karu — a peacock and kuṟiñci flower "are" the hills.',
      },
      {
        emoji: '💞',
        ta: 'உரிப்பொருள்',
        en: 'Uri — The Fitting Mood',
        desc: 'The one phase of love each landscape owns: Kuṟiñci = union, Mullai = patient waiting, Marutam = lovers\' quarrel, Neytal = anxious pining, Pālai = separation. The muthal and karu exist to voice the uri.',
      },
      {
        emoji: '🌾',
        ta: 'ஐந்திணை',
        en: 'The Five Landscapes',
        desc: 'Kuṟiñci (mountains) · Mullai (forest) · Marutam (cropland) · Neytal (seashore) · Pālai (wasteland). Explore each as a living world in the Sangam World navigator.',
        to: '/world',
      },
    ],
  },

  // ────────────────────────────────────────────────────────── puram tinai ──
  {
    id: 'puram-tinai',
    ta: 'புறத்திணை',
    en: 'The Seven Puṟam Tiṇais',
    icon: '🛡',
    intro:
      'Puṟam has its own seven tiṇais, most tracing the stages of ancient Tamil warfare — from the opening cattle-raid to the final praise of the fallen — each the public mirror of an akam landscape.',
    items: [
      { emoji: '🐄', ta: 'வெட்சி', en: 'Vetchi', desc: 'The cattle-raid that opens hostilities — warriors wearing scarlet vetchi flowers drive off the enemy\'s herds.' },
      { emoji: '🚩', ta: 'வஞ்சி', en: 'Vanji', desc: 'The march to invade — mustering the army and setting out against a rival kingdom.' },
      { emoji: '🏰', ta: 'உழிஞை', en: 'Uḻiñai', desc: 'The siege — investing and defending the fortified walls of a besieged city.' },
      { emoji: '⚔️', ta: 'தும்பை', en: 'Tumbai', desc: 'The pitched battle — open combat of the massed forces on the field.' },
      { emoji: '🏆', ta: 'வாகை', en: 'Vākai', desc: 'Victory and its garland — the triumph of the victor, worn as a vākai wreath.' },
      { emoji: '🍃', ta: 'காஞ்சி', en: 'Kāñci', desc: 'Impermanence — the transience of life and worldly glory; philosophical reflection amid war.' },
      { emoji: '👑', ta: 'பாடாண்', en: 'Pāṭāṇ', desc: 'Praise and elegy — hymning a patron\'s virtues, or mourning a hero; the seedbed of the āṟṟuppaṭai idylls.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────── poets ──
  {
    id: 'poets',
    ta: 'சங்கப் புலவர்கள்',
    en: 'The Poets',
    icon: '🖋',
    intro:
      'Some 473 poets are named across the corpus — kings, potters, blacksmiths, merchants and women among them. Many signatures survive only as epithets drawn from a memorable line they wrote.',
    items: [
      {
        emoji: '🏔',
        ta: 'கபிலர்',
        en: 'Kapilar',
        desc: 'The most prolific Sangam poet and supreme voice of the kuṟiñci (hill) landscape. Bard and devoted friend of the chieftain Pāri; author of Kuṟiñcippāṭṭu and hundreds of akam verses.',
      },
      {
        emoji: '📖',
        ta: 'பரணர்',
        en: 'Paraṇar',
        desc: 'Master narrator whose poems double as a chronicle of the age, rich in named kings, battles and places — a prime historical source for Sangam-era events.',
      },
      {
        emoji: '🌟',
        ta: 'நக்கீரர்',
        en: 'Nakkīrar',
        desc: 'Traditionally head of the Third Sangam; author of Tirumurukāṟṟuppaṭai (the hymn to Murugaṉ that opens the Pattuppāṭṭu) and of Neṭunalvāṭai.',
      },
      {
        emoji: '🌿',
        ta: 'ஔவையார்',
        en: 'Auvaiyār',
        desc: 'The great woman poet of the puṟam tradition, close to the chieftain Atiyamāṉ, who sent her as his envoy. Celebrated for her wisdom and her verses on generosity and valour.',
      },
      {
        emoji: '🌍',
        ta: 'கணியன் பூங்குன்றனார்',
        en: 'Kaṇiyan Pūṅkuṉṟaṉār',
        desc: 'Author of Puṟanāṉūṟu 192, "yātum ūrē yāvarum kēḷir" — the timeless declaration of universal kinship and equanimity.',
      },
      {
        emoji: '🕰',
        ta: 'மாமூலனார்',
        en: 'Māmūlaṉār',
        desc: 'Poet of the pālai (wasteland) and of long journeys, whose allusions to Mauryan and Nanda incursions help anchor the corpus in datable history.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────── kings/patrons ──
  {
    id: 'patrons',
    ta: 'மன்னரும் வள்ளல்களும்',
    en: 'Kings & Patrons',
    icon: '👑',
    intro:
      'Three crowned dynasties (Mūventar) shared the Tamil country with a constellation of chieftains. Poets travelled between their courts; the finest generosity was itself worth a poem.',
    items: [
      {
        emoji: '🏹',
        ta: 'சேரர்',
        en: 'Chera',
        desc: 'Rulers of the western hills and Malabar coast; emblem the bow. Their deeds fill the Patiṟṟuppattu, ten decades each praising a Chera king.',
      },
      {
        emoji: '🐅',
        ta: 'சோழர்',
        en: 'Chola',
        desc: 'Lords of the fertile Kāvēri delta; emblem the tiger. Karikāla, victor of Veṇṇi and builder of the Kāvēri embankments, is their great Sangam-age figure.',
      },
      {
        emoji: '🐟',
        ta: 'பாண்டியர்',
        en: 'Pandya',
        desc: 'Kings of Madurai and the southern coast; emblem the carp. Patrons of the Sangam academies and of the pearl fisheries of the Neytal shore.',
      },
      {
        emoji: '🤲',
        ta: 'கடையேழு வள்ளல்கள்',
        en: 'The Seven Great Patrons',
        desc: 'The kaḍai-eḻu vaḷḷalgaḷ — Pāri, Kāri, Ōri, Nalli, Pēkaṉ, Āy and Atiyamāṉ — chieftains whose open-handed generosity became proverbial. Pāri, it is sung, gave his chariot to a jasmine creeper that had nothing to climb.',
      },
    ],
  },

  // ───────────────────────────────────────────────────── music & performers ──
  {
    id: 'music',
    ta: 'இசையும் கலைஞரும்',
    en: 'Music & Performers',
    icon: '🎶',
    intro:
      'Music was woven through Sangam life. Wandering bard-communities carried news, praise and melody from court to court — and a whole genre, the āṟṟuppaṭai, is one poor bard directing another to a generous patron.',
    items: [
      {
        emoji: '🎵',
        ta: 'யாழ்',
        en: 'Yāḻ (Harp-Lute)',
        desc: 'The signature Sangam string instrument — a skin-bellied harp strung from a curved neck, made in many sizes from the small ceviyāḻ to the great peiyāḻ of 21 strings. The pāṇar\'s companion.',
      },
      {
        emoji: '🥁',
        ta: 'பறை & முரசு',
        en: 'Paṟai & Muracu',
        desc: 'The paṟai is the all-purpose hand-drum of village and battlefield; the muracu is the great royal war-drum, guarded as a symbol of sovereignty and never allowed to fall silent or be captured.',
      },
      {
        emoji: '🪈',
        ta: 'குழல்',
        en: 'Kuḻal (Flute)',
        desc: 'The transverse bamboo flute of shepherds and lovers, whose melody carries across the mullai forest and calls the cattle home at dusk.',
      },
      {
        emoji: '🎼',
        ta: 'பண்',
        en: 'Paṇ (Melodic Modes)',
        desc: 'Ancient Tamil melody-scales, each tied to a landscape and mood (kuṟiñci paṇ, mullai paṇ …) — precursors of the later Carnatic rāgas.',
      },
      {
        emoji: '🎭',
        ta: 'பாணர் & விறலியர்',
        en: 'Pāṇar & Viṟaliyar',
        desc: 'The hereditary performer communities: pāṇar (male bards / yāḻ-players), viṟaliyar (women dancers) and porunar (martial minstrels) — the poets\' subjects, messengers, and often the poets themselves.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────── life & culture ──
  {
    id: 'life',
    ta: 'வாழ்வும் பண்பாடும்',
    en: 'Daily Life & Material Culture',
    icon: '🏺',
    intro:
      'Behind the imagery is a vivid record of an early historic society — its trades, seaports, food, ornament and belief — much of it confirmed by the archaeology of Keezhadi and the Roman-trade coin hoards.',
    items: [
      {
        emoji: '⚓',
        ta: 'கடல் வாணிபம்',
        en: 'Sea Trade',
        desc: 'Bustling ports like Kāvirippūmpaṭṭiṉam and Musiri traded pepper, pearls and cloth for Roman gold. Pattiṉappālai paints the wharves, warehouses and foreign quarter of a Chola port city.',
      },
      {
        emoji: '🌾',
        ta: 'வேளாண்மை',
        en: 'Farming & Food',
        desc: 'Delta rice, hill millet (tiṇai), honey, and toddy. Marutam poetry turns on paddy fields, buffalo, and the abundance — and quarrels — of settled agricultural wealth.',
      },
      {
        emoji: '💍',
        ta: 'அணிகலன்',
        en: 'Ornament & Dress',
        desc: 'Garlands keyed to each landscape\'s flowers, conch bangles from the Neytal shore, gold and gemstones, and the significant act of a bride donning the toḍi (bangle). Dress and flower mark status and mood.',
      },
      {
        emoji: '🪦',
        ta: 'நடுகல்',
        en: 'Hero Stones',
        desc: 'The naṭukal — a carved memorial stone raised over a hero fallen in a cattle-raid or battle, worshipped with flowers and peacock feathers. The earliest attested Tamil memorial tradition.',
      },
      {
        emoji: '🏺',
        ta: 'கீழடி',
        en: 'Keezhadi & Archaeology',
        desc: 'Excavations at Keezhadi near Madurai reveal an urban, literate Tamil society (brick structures, graffiti-marked potsherds, spindle whorls) contemporary with the poems — material proof of the world they describe.',
        tag: 'Modern context',
      },
    ],
  },
]

export const KNOWLEDGE_BY_ID = Object.fromEntries(
  KNOWLEDGE_SECTIONS.map((s) => [s.id, s])
)
