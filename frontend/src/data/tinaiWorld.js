/**
 * tinaiWorld.js — Open-world asset registry for the five Tiṇai (poetic landscape) zones.
 *
 * Each zone carries the full set of classical attributes drawn from Sangam poetry
 * (Tolkāppiyam, Natrinai, Akam, Purananuru, etc.) and mapped to visual/interactive
 * world-building categories similar to the kind of cultural depth found in games
 * that explore the Dravidian / ancient Tamil world.
 *
 * Sources: Tolkāppiyam · Purananuru · Natrinai · Akananuru · Kuruntokai
 */

export const TINAI_WORLD = {
  kurinji: {
    id: 'kurinji',
    ta: 'குறிஞ்சி',
    en: 'Mountains & Hills',
    subEn: 'Highlands of love and union',
    emoji: '🏔',

    atmosphere: {
      season: { ta: 'கூதிர் / முன்பனி', en: 'Late Monsoon & Early Winter', desc: 'Mist-draped peaks after the rains; cold nights, roaring waterfalls, and the rare kurinji bloom.' },
      timeOfDay: { ta: 'யாமம்', en: 'Midnight', desc: 'The hour of lovers — darkness lightened only by stars and fireflies over the hill flowers.' },
      weather: 'Misty, cool, occasional rain; waterfalls in full spate',
      sky: 'Deep indigo with scattered stars; fog drifting between peaks',
      ambience: ['Distant waterfall roar', 'Peacock calls at dusk', 'Wind through bamboo', 'Distant drum from hill shrine'],
    },

    deity: {
      ta: 'முருகன் / செவ்வேல் செய்யோன்',
      en: 'Murugan — Lord of the Hills',
      desc: 'God of mountains and youth, worshipped on hilltops with sacred torches. Rides the peacock, wields the vel (spear). Patron of the Kuravar hill people and of all young love.',
      symbol: 'Vel (spear) · Peacock · Red Kurinji flower',
      epithets: ['Seyon (The Red One)', 'Kumaran (The Youth)', 'Velan (Spear-Bearer)', 'Murukan'],
    },

    emotion: {
      akam: { ta: 'களவு — கலவி', en: 'Secret union & first love', desc: 'The joy of lovers secretly meeting in the mountains — the central emotion of kurinji poetry.' },
      puram: { ta: 'வீரம்', en: 'Valor in battle', desc: 'Hill warriors known for their bravery and ferocity, like a mountain stream.' },
    },

    landscape: [
      { ta: 'அருவி', en: 'Waterfall', desc: 'Thundering cascades over black granite; the sound is omnipresent in kurinji poems as the voice of the hills.' },
      { ta: 'மலைக்குகை', en: 'Mountain Cave', desc: 'Natural grottos used as lovers\' meeting places and as shrines to Murugan.' },
      { ta: 'தேன்கூடு', en: 'Honeycomb Cliff', desc: 'Cliff faces laced with wild beehives — gathering this honey is a rite of passage for the Kuravar youth.' },
      { ta: 'சிலம்பு', en: 'Hill Stream', desc: 'Swift, clear streams threading between mossy boulders, carrying the cold of the peaks.' },
      { ta: 'கவாது', en: 'Mountain Pass', desc: 'High passes between ranges where caravans cross and lovers exchange garlands before parting.' },
      { ta: 'மூங்கில் காடு', en: 'Bamboo Grove', desc: 'Dense bamboo thickets that hollow-whistle in the wind, audible from afar.' },
    ],

    flora: [
      { ta: 'குறிஞ்சி', en: 'Kurinji (Strobilanthes)', species: 'Strobilanthes kunthiana', desc: 'The sacred blue-purple hill flower that blooms once every twelve years, turning entire mountainsides violet. Namesake of this landscape.', emoji: '💜' },
      { ta: 'வேங்கை', en: 'Venkai (Indian Kino)', species: 'Pterocarpus marsupium', desc: 'Brilliant orange-yellow blossoms that Sangam poets compared to golden ornaments on the hillside.', emoji: '🌼' },
      { ta: 'காந்தள்', en: 'Kantal (Gloriosa Lily)', species: 'Gloriosa superba', desc: 'The flame lily — fiery red petals curling backward, worn as an ornament by Kuravar women.', emoji: '🌺' },
      { ta: 'மஞ்சாடி', en: 'Manjadi (Coral Bead)', species: 'Adenanthera pavonina', desc: 'Scarlet seeds used to weigh gold by hill traders; also strung as necklaces.', emoji: '🔴' },
      { ta: 'தேக்கு', en: 'Teak', species: 'Tectona grandis', desc: 'Towering teak trees with broad leaves, providing timber for mountain settlements.', emoji: '🌳' },
      { ta: 'மூங்கில்', en: 'Bamboo', species: 'Bambusa spp.', desc: 'The spine of hill life — used for houses, vessels, flutes, and fences.', emoji: '🎋' },
      { ta: 'நெடல்', en: 'Wild Mango', species: 'Mangifera indica (wild)', desc: 'Hill mangoes, smaller and tangier than valley fruit; monkeys raid them at dawn.', emoji: '🥭' },
    ],

    fauna: [
      { ta: 'மயில்', en: 'Peacock', species: 'Pavo cristatus', desc: 'The sacred mount of Murugan. Its dawn cry pierces the mountain mist; its feathers adorn festival headdresses.', emoji: '🦚' },
      { ta: 'யானை', en: 'Elephant', species: 'Elephas maximus', desc: 'The great hill elephant, master of the jungle. Sangam poems describe its crushing footsteps and its love for kadambu fruit.', emoji: '🐘' },
      { ta: 'கரடி', en: 'Bear', species: 'Melursus ursinus', desc: 'The honey bear of the hills — Kuravar hunters imitate its gait and compete with it for cliff-honey.', emoji: '🐻' },
      { ta: 'குரங்கு', en: 'Monkey', species: 'Macaca radiata', desc: 'Bonnet macaques that swarm fruit trees; their chatter signals approaching strangers to hill villages.', emoji: '🐒' },
      { ta: 'மான்', en: 'Spotted Deer', species: 'Axis axis', desc: 'The kurinji deer — delicate, swift, with eyes poets compared to the eyes of a beloved.', emoji: '🦌' },
      { ta: 'காட்டுக்கோழி', en: 'Jungle Fowl', species: 'Gallus sonneratii', desc: 'Ancestor of the domestic chicken; its crowing marks dawn on the mountain and is heard in many Natrinai verses.', emoji: '🐓' },
      { ta: 'மரகத பறவை', en: 'Hill Myna', species: 'Gracula religiosa', desc: 'Jet-black with a golden eye-patch; can mimic human speech and was kept as a messenger by hill folk.', emoji: '🐦' },
    ],

    people: [
      { ta: 'குறவர்', en: 'Kuravar', role: 'Hill people', desc: 'The indigenous mountain community — bold, joyful, known for their honey-gathering, millet farming, and festivals to Murugan. Sangam poems celebrate their fearlessness.' },
      { ta: 'வேடுவர்', en: 'Vedavar', role: 'Hunters', desc: 'Expert hunters with bows and nets; they read the jungle like a text and trade game meat and hides with valley people.' },
      { ta: 'மலையப் பெண்கள்', en: 'Hill Women', role: 'Gatherers & weavers', desc: 'Wore kantal garlands and kurinji-flower wreaths; gathered wild turmeric, honey, and hill fruits; wove cloth on simple looms.' },
      { ta: 'வேலன்', en: 'Velan', role: 'Shaman-priest of Murugan', desc: 'The velan performed the sacred veriyāttu dance in trance to commune with Murugan and heal the sick. One of the most vivid figures in Sangam poetry.' },
    ],

    music: [
      { ta: 'குழல்', en: 'Kuzhal (Flute)', desc: 'A transverse bamboo flute — the quintessential sound of the hills. Its melody carries for miles and is used by shepherds to call cattle and by lovers to signal meetings.' },
      { ta: 'குறிஞ்சிப் பண்', en: 'Kurinji Pann (Melody mode)', desc: 'The raga (pann) of the hills — lively, celebratory, associated with Murugan worship. Ancient precursor of modern Carnatic ragas in the kurinji mela.' },
      { ta: 'தொண்டக முரசு', en: 'Tondaka Murasu (Hill Drum)', desc: 'A deep-toned drum carved from a single teak log, beaten at festivals and to warn of wild animals.' },
      { ta: 'வேட்டை ஊது கொம்பு', en: 'Hunt Horn', desc: 'A curved horn (sometimes from a mountain buffalo) blown during the collective hunt to coordinate the hunters on the slopes.' },
    ],

    crafts: [
      { ta: 'தேன் சேகரிப்பு', en: 'Cliff Honey Harvest', desc: 'Kuravar climbers use rope ladders and torches to collect wild honey from cliffs — a ritual activity accompanied by prayer and songs to Murugan.' },
      { ta: 'வேங்கை சாயம்', en: 'Venkai Bark Dye', desc: 'Red-brown dye extracted from kino tree bark; used to colour cloth and the faces of festival dancers.' },
      { ta: 'மலை வேளாண்மை', en: 'Terrace Farming', desc: 'Ingeniously cut stone terraces on slopes for millet, ragi, and hill varieties of rice; fed by diversion of mountain streams.' },
    ],

    architecture: [
      { ta: 'குன்றக்கோட்டம்', en: 'Hilltop Murugan Shrine', desc: 'Stone sanctuaries on the highest accessible peak, often marked by a tall flag pole with a peacock emblem. The velan conducted trance-dances here.' },
      { ta: 'குறவர் குடில்', en: 'Kuravar Hut', desc: 'Wattle-and-daub or bamboo-and-thatch dwellings built on stilts against the hillside, with a central fire pit and bamboo storage lofts.' },
      { ta: 'கல்வெட்டு நினைவு', en: 'Hero Stone', desc: 'Carved granite slabs commemorating hunters or warriors slain by wild animals or in clan battles — ancestor of the vīrakkal tradition.' },
    ],

    poetry: {
      classic: 'யாயும் ஞாயும் யாரா கியரோ / எந்தையும் நுந்தையும் எம்முறைக் கேளிர் / யானும் நீயும் எவ்வழி யறிதும் / செம்புலப் பெயல்நீர் போல / அன்புடை நெஞ்சம் தாம் கலந்தனவே',
      poem: 'Kurunthokai 40 — "How did our hearts blend like the rain upon red clay — though our mothers are strangers, our fathers were never kin?"',
    },

    colors: { primary: 'from-purple-900 to-indigo-950', accent: 'text-purple-300', badge: 'bg-purple-900/50 text-purple-200', border: 'border-purple-700' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  mullai: {
    id: 'mullai',
    ta: 'முல்லை',
    en: 'Forest & Pastoral',
    subEn: 'Woodlands of faithful waiting',
    emoji: '🌿',

    atmosphere: {
      season: { ta: 'கார்காலம்', en: 'Rainy Season (Southwest Monsoon)', desc: 'The green season — forests dripping with rain, fresh grass gleaming, kadambu trees bursting into golden bloom at the first thunder.' },
      timeOfDay: { ta: 'மாலை', en: 'Dusk / Evening', desc: 'The melancholy hour when cattle return home and wives wait by the gate for husbands still journeying far away.' },
      weather: 'Warm rains, humid, lush and green; thunder in the distance',
      sky: 'Dark monsoon clouds shot through with amber at sunset; rainbow over the forest canopy',
      ambience: ['Koel singing at dusk', 'Cattle bells', 'Rain on broad forest leaves', 'Thunder rolling over the canopy'],
    },

    deity: {
      ta: 'மாயோன் / திருமால்',
      en: 'Mayon — The Dark One (Vishnu)',
      desc: 'Lord of the dark forest and cattle folk. Manifests as a cowherd youth (identical to Krishna), charming cattle and playing his flute in the emerald groves. Protector of the Ayar community.',
      symbol: 'Flute · Dark forest · Cattle · Konrai garland',
      epithets: ['Mayon (The Dark One)', 'Nedumal (The Tall Lord)', 'Ninra Perumal', 'Ayar Talaivan (Lord of the Cowherds)'],
    },

    emotion: {
      akam: { ta: 'இருத்தல் — காத்திருத்தல்', en: 'Patient waiting & fidelity', desc: 'The wife waiting faithfully for her husband to return from a distant journey — the dominant mullai akam emotion.' },
      puram: { ta: 'வீட்டிற்கு திரும்புதல்', en: 'Homecoming & victory', desc: 'Warriors returning home to their families through forest paths after long campaigns.' },
    },

    landscape: [
      { ta: 'கடம்பு காடு', en: 'Kadamba Forest', desc: 'Groves of kadamba trees exploding with golden ball-flowers at the first monsoon rain — the defining image of mullai poetry.' },
      { ta: 'மேய்ச்சல் வெளி', en: 'Grazing Meadow', desc: 'Open glades where cattle graze; the jingle of bells and lowing of cows defines the pastoral soundscape.' },
      { ta: 'கால்வாய்', en: 'Forest Stream', desc: 'Slow, tree-shaded streams where cattle drink and women fill clay pots at dawn.' },
      { ta: 'ஆய்ச்சி குடில்', en: 'Cowherd Settlement', desc: 'A cluster of thatched huts, cattle pens, and butter-churn platforms — the Ayar village humming with daily life.' },
      { ta: 'முல்லை பந்தல்', en: 'Jasmine Bower', desc: 'Natural arbours where jasmine vines climb trees, filling the air with scent especially at nightfall.' },
    ],

    flora: [
      { ta: 'முல்லை', en: 'Mullai (Jasmine)', species: 'Jasminum sambac / auriculatum', desc: 'The white jasmine that fills the forest at dusk with an almost overwhelming fragrance. Its garlands are worn by women awaiting their lovers.', emoji: '🌸' },
      { ta: 'கடம்பு', en: 'Kadamba', species: 'Neolamarckia cadamba', desc: 'Golden sphere-flowers that burst open at the first raindrop — the herald of monsoon and homecoming.', emoji: '🌼' },
      { ta: 'கொன்றை', en: 'Konrai (Indian Laburnum)', species: 'Cassia fistula', desc: 'Cascading golden-yellow racemes; sacred to Shiva and used in Pongal festivals.', emoji: '💛' },
      { ta: 'பிடவம்', en: 'Pidavam (Forest Creeper)', species: 'Randia dumetorum', desc: 'A white-flowered forest vine whose fragrance at dusk signals the start of the monsoon.', emoji: '🌿' },
      { ta: 'காய்க்குருவி', en: 'Caper Bush', species: 'Capparis sepiaria', desc: 'A spiny shrub at forest edges; its flower buds are pickled and its fruits eaten by birds.', emoji: '🌱' },
    ],

    fauna: [
      { ta: 'குயில்', en: 'Koel (Asian Cuckoo)', species: 'Eudynamys scolopaceus', desc: 'The torment bird of mullai poetry — its rising, liquid call at dusk drives home the pain of the waiting wife. Parasitizes crow nests.', emoji: '🐦' },
      { ta: 'பசு', en: 'Cow', species: 'Bos indicus (indigenous)', desc: 'The sacred anchor of pastoral life. Sangam poems measure wealth in cattle and describe cows as gentle as the moonlight.', emoji: '🐄' },
      { ta: 'எருது', en: 'Bull', species: 'Bos indicus', desc: 'The Jallikattu bull of ancient Tamil tradition — tamed or fought as a test of manhood at harvest festivals.', emoji: '🐂' },
      { ta: 'ஓநாய்', en: 'Indian Wolf', species: 'Canis lupus pallipes', desc: 'The forest predator feared by cowherds; its howl at dusk warned of danger and appears as a metaphor for danger in mullai poems.', emoji: '🐺' },
      { ta: 'முயல்', en: 'Hare', species: 'Lepus nigricollis', desc: 'Swift hare of the meadow; its ears pricked at the slightest sound, a symbol of alertness in the poems.', emoji: '🐇' },
    ],

    people: [
      { ta: 'ஆயர்', en: 'Ayar', role: 'Cowherd folk', desc: 'The pastoral community of the Mullai zone — gentle, musical, deeply devoted to Mayon/Vishnu. Their life revolved around cattle, butter-making, and the rainy-season festivals.' },
      { ta: 'ஆய்ச்சியர்', en: 'Ayachchiyar', role: 'Cowherd women', desc: 'Known for their skill in butter-churning, their singing while tending cattle, and their moonflower garlands. Sangam poetry gives them a quiet, dignified voice.' },
      { ta: 'இடையர்', en: 'Idaiyar', role: 'Shepherds', desc: 'Herders of goats and sheep across the forest fringe; played the flute to soothe their herds in the evening.' },
    ],

    music: [
      { ta: 'யாழ்', en: 'Yazh (Harp)', desc: 'The ancient Tamil harp — multiple strings, played with a plectrum or fingers. The supreme instrument of mullai; its music evoked the lush forest and deep emotion of separation.' },
      { ta: 'முல்லைப் பண்', en: 'Mullai Pann (Melody mode)', desc: 'The raga of the forest — tender, slightly melancholic, evoking the waiting wife and the scent of night jasmine. Evening concerts were played in this mode.' },
      { ta: 'நாகரி', en: 'Nagari (Pastoral Horn)', desc: 'A simple cow-horn flute blown by cowherds to signal their cattle and to serenade the evening.', },
      { ta: 'தண்ணுமை', en: 'Thannumai (Forest Drum)', desc: 'A barrel drum covered in deer hide, beaten at rain-welcoming festivals and temple processions.' },
    ],

    crafts: [
      { ta: 'வெண்ணெய் உருட்டல்', en: 'Butter Churning', desc: 'Curd churned in large clay pots with a wooden pole; the sound of churning at dawn is described in Sangam verses as the melody of the Mullai settlement.' },
      { ta: 'பின்னல்', en: 'Flower Garland Weaving', desc: 'Women spent evenings threading jasmine, konrai and mullai into elaborate garlands — gifted to Mayon\'s shrine and to homecoming husbands.' },
    ],

    architecture: [
      { ta: 'ஆயர்பாடி', en: 'Ayarpadi (Cowherd Settlement)', desc: 'Clusters of round thatched huts around a central cattle pen; surrounded by wooden fences and kadamba trees. The communal butter-making stone sat at the village centre.' },
      { ta: 'மாயோன் கோட்டம்', en: 'Mayon Shrine', desc: 'A simple forest clearing with a carved dark-stone image of Mayon garlanded with konrai flowers. Festivals were held here at the first rains.' },
    ],

    poetry: {
      classic: 'ஆடுகொள் வீயின் அலர்மலி உந்தி / நாடுகொள் சிறப்பின் நன்னாட்டுப் பெண்டிரொடு / கார்கோள் முன்னிய கமழ்மலர் கடம்பின்',
      poem: 'Kurunthokai 219 — The kadamba blossoms at first rain; the koel cries from the grove. But you are far away and have not yet come home.',
    },

    colors: { primary: 'from-green-900 to-emerald-950', accent: 'text-green-300', badge: 'bg-green-900/50 text-green-200', border: 'border-green-700' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  marutam: {
    id: 'marutam',
    ta: 'மருதம்',
    en: 'Cropland & River Delta',
    subEn: 'Fertile plains of quarrel and reconciliation',
    emoji: '🌾',

    atmosphere: {
      season: { ta: 'முன்பனி / இலையுதிர்', en: 'Early Winter & Post-Monsoon', desc: 'The harvest season — paddies golden, rivers running full, and the air thick with the scent of fermenting grain.' },
      timeOfDay: { ta: 'வைகறை', en: 'Pre-dawn to Morning', desc: 'Marutam comes alive before dawn — heron calls, the splash of ploughing, quarrels and reconciliations played out as the village wakes.' },
      weather: 'Mild, with morning mist over flooded paddies and a crisp breeze from the river',
      sky: 'Pale gold dawn sky; cranes flying in formation over the paddy; blue sky by mid-morning',
      ambience: ['Crane calls over the paddy', 'Plough bells', 'Water buffalo lowing', 'River current over stones', 'Women singing at the well'],
    },

    deity: {
      ta: 'இந்திரன்',
      en: 'Indiran (Indra) — Lord of Rain & Prosperity',
      desc: 'King of the gods, bringer of rain and prosperity to the delta. Marutam festivals were celebrated in his honour with bull-fights and community feasts. His banner flew over prosperous towns.',
      symbol: 'Vajra (thunderbolt) · Elephant Airavata · Indra\'s flag · Marutam flower',
      epithets: ['Vendhan (King of Gods)', 'Mazhaivan (Rain Giver)', 'Periyavan (The Great One)'],
    },

    emotion: {
      akam: { ta: 'ஊடல் — பரத்தமை', en: 'Infidelity & lovers\' quarrels', desc: 'The marutam emotion is the quarrel between wife and husband over his infidelity — frank, spirited, and often resolved through wit and gifts.' },
      puram: { ta: 'வெற்றி கொண்டாட்டம்', en: 'Celebration of victories', desc: 'Prosperous marutam towns hosted celebration feasts for returning warriors and generous kings.' },
    },

    landscape: [
      { ta: 'வயல்', en: 'Paddy Field', desc: 'Endless terraced paddy under water — the mirror of the sky. Irrigation channels fan out from the river like veins, and herons wade between the shoots.' },
      { ta: 'ஆறு', en: 'River', desc: 'The great delta river — wide, slow, brown with silt. Boats move grain; women wash clothes on the ghats; fishermen cast nets from dugout canoes.' },
      { ta: 'அஞ்சனவனம்', en: 'Kajal-Tree Grove (Marutam grove)', desc: 'Stands of marutam (arjuna) trees lining the river bank — their white flowers fall like snow into the current.' },
      { ta: 'நகரம்', en: 'Market Town', desc: 'Bustling river towns — merchants, bards, craftspeople, and taverns; the social and economic centre of the delta.' },
      { ta: 'குளம்', en: 'Tank / Pond', desc: 'Large irrigation tanks built by kings; covered with lotus, inhabited by crocodiles and many birds.' },
    ],

    flora: [
      { ta: 'மருதம்', en: 'Marutam (Arjuna Tree)', species: 'Terminalia arjuna', desc: 'A massive river-bank tree with white flowers and buttressed roots. Its bark was used in medicine; the falling flowers are a recurring image in akam poetry.', emoji: '🌸' },
      { ta: 'ஆம்பல்', en: 'White Water Lily', species: 'Nymphaea lotus', desc: 'Opens at dawn in irrigation tanks; associated with purity and with the beloved\'s eyes in Sangam comparisons.', emoji: '🌼' },
      { ta: 'செங்கழுநீர்', en: 'Red Lotus', species: 'Nelumbo nucifera', desc: 'Sacred lotus of the delta — floats on tanks, picked for temple offerings and garlands.', emoji: '🪷' },
      { ta: 'கைதை', en: 'Screw Pine (Kaithai)', species: 'Pandanus odorifer', desc: 'Grows at river edges; its intensely scented male flowers (kewra) are used in perfumes and offerings.', emoji: '🌿' },
      { ta: 'வாழை', en: 'Banana', species: 'Musa paradisiaca', desc: 'A staple crop of the river delta; the large leaves used as plates, the flower and fruit in festivals.', emoji: '🍌' },
    ],

    fauna: [
      { ta: 'நாரை', en: 'Painted Stork', species: 'Mycteria leucocephala', desc: 'The iconic delta bird — tall, deliberate, wading through paddies. Its patient hunting style is a metaphor in marutam poems for the jealous wife observing her husband.', emoji: '🦢' },
      { ta: 'கொக்கு', en: 'Grey Heron', species: 'Ardea cinerea', desc: 'Stands motionless in the shallows before a lightning-fast strike. Associated in poetry with the opportunistic rival.', emoji: '🦤' },
      { ta: 'மீன்கொத்தி', en: 'Common Kingfisher', species: 'Alcedo atthis', desc: 'A jewel of turquoise and orange flashing over the river — one of the most vivid images in Sangam nature poetry.', emoji: '🐦‍🔥' },
      { ta: 'எருமை', en: 'Water Buffalo', species: 'Bubalus arnee', desc: 'The great plough animal — dark, powerful, standing in the mud of the paddy. Sangam poems praise its patient endurance.', emoji: '🐃' },
      { ta: 'தவளை', en: 'Frog', species: 'Rana spp.', desc: 'The frogs erupt in the paddy at the first rains — their chorus is a marutam symbol for the unrestrained voice of joy.', emoji: '🐸' },
    ],

    people: [
      { ta: 'உழவர்', en: 'Uzhavar', role: 'Farmers', desc: 'The backbone of the marutam economy — ploughing, transplanting rice shoots, managing irrigation. Their songs (ullavar pattus) set the rhythm of agricultural work.' },
      { ta: 'வணிகர்', en: 'Vanigar', role: 'Merchants', desc: 'Delta traders moving grain, cloth, and spices by river boat. Marutam towns were trade hubs; the wealthy merchant\'s prosperous household is a recurring setting in akam poems.' },
      { ta: 'வேளான் மகளிர்', en: 'Velan Women', role: 'Paddy workers', desc: 'Women who transplanted, weeded, and harvested the paddy — singing work-songs that survived as folk traditions for centuries.' },
      { ta: 'கணிகையர்', en: 'Kanigaiyar', role: 'Court entertainers', desc: 'Skilled dancers and musicians in the market towns; mentioned in marutam poems as rivals for a husband\'s attention.' },
    ],

    music: [
      { ta: 'தடாரி', en: 'Thadari (Frame Drum)', desc: 'A flat drum of the river delta, beaten during harvest festivals and to accompany work songs in the paddy fields.' },
      { ta: 'மருதப் பண்', en: 'Marutham Pann (Melody mode)', desc: 'The raga of the cropland — vigorous, earthy, sometimes argumentative in character. Sung at festivals and in the marketplace.' },
      { ta: 'ஓதைப் பாட்டு', en: 'Harvest Song', desc: 'Call-and-response songs sung by paddy workers as they transplanted shoots — a form that shaped later Tamil folk music traditions.' },
    ],

    crafts: [
      { ta: 'நெல் உமி கைவினை', en: 'Rice Craft', desc: 'Straw woven into baskets, floor mats, hats and effigies for festivals; rice husks mixed with clay to build durable walls.' },
      { ta: 'மண்கலம்', en: 'River Pottery', desc: 'Wheel-thrown red-ware pottery using delta clay — storage jars, cooking pots, and the distinctive marutam lamp-stand.' },
      { ta: 'நெசவு', en: 'Cotton Weaving', desc: 'Delta cotton woven on horizontal frame looms; the fine white cloth was traded far inland and described in Sangam poems.' },
    ],

    architecture: [
      { ta: 'இந்திர விழா மேடை', en: 'Indra Festival Pavilion', desc: 'Erected annually in delta towns for the Indra festival — decorated with banana flowers, mango leaves, and torches; the site of bull-fights and feasting.' },
      { ta: 'அணை', en: 'Dam & Sluice', desc: 'Ancient stone dams diverting river water into irrigation channels — engineering marvels described in inscriptions and alluded to in Sangam poems about prosperity.' },
    ],

    poetry: {
      classic: 'மருதம் நிழலிய வெண்மணல் அடைகரை / ஆடுகொள் வேனில் அவிர்மணல் குறுமுன்று',
      poem: 'Akananuru 136 — She stood by the white sand of the marutam-shaded bank, and her eyes, like the lotus, told of her unspoken anger.',
    },

    colors: { primary: 'from-yellow-900 to-amber-950', accent: 'text-yellow-300', badge: 'bg-yellow-900/50 text-yellow-200', border: 'border-yellow-700' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  neytal: {
    id: 'neytal',
    ta: 'நெய்தல்',
    en: 'Seashore & Backwaters',
    subEn: 'Coastal world of longing and lament',
    emoji: '🌊',

    atmosphere: {
      season: { ta: 'அனைத்து காலமும் / இலையுதிர்', en: 'All seasons (esp. dry season)', desc: 'The coast belongs to every season but feels most raw in the dry months — the sea a harsh blue, the cry of gulls sharp in the salt air.' },
      timeOfDay: { ta: 'அந்தி மாலை', en: 'Evening and Twilight', desc: 'The sea at sunset — blazing gold turning purple-blue; the hour when fishermen return and women scan the horizon for a sail.' },
      weather: 'Sea breezes, salt air; occasional storms; mist at dawn over the backwaters',
      sky: 'Vast open sky — crimson at sunset, milky with stars at night; clouds gathering on the horizon',
      ambience: ['Waves on the shore', 'Gull cries', 'Conch shell announcements from boats', 'Salt-wind in the punnai trees', 'Fishermen\'s chants as nets are hauled'],
    },

    deity: {
      ta: 'வருணன் / கடலோன்',
      en: 'Varunan — Lord of the Sea',
      desc: 'Ancient Vedic sea-god embraced by Tamil coastal culture; god of the waters, oath-keeper, and punisher of the unjust. Propitiated before every sea voyage with offerings and song.',
      symbol: 'Conch shell · Sea · Net · Blue water lily',
      epithets: ['Kadalon (The Sea Lord)', 'Neelan (The Blue One)', 'Mazhaiman (Rain and Sea)'],
    },

    emotion: {
      akam: { ta: 'இரங்கல் — ஆற்றாமை', en: 'Longing, lament & anxious waiting', desc: 'The beloved waits on the shore for her lover who has sailed away or journeyed by the coastal road; her longing is as vast as the sea itself.' },
      puram: { ta: 'கடல் கடந்த வீரம்', en: 'Naval valor & seafaring heroism', desc: 'Sangam kings sent fleets; coastal warriors were celebrated for their courage on the open sea and in coastal raids.' },
    },

    landscape: [
      { ta: 'கடற்கரை', en: 'Beach', desc: 'White sand beaches where nets are spread to dry, boats pulled up, and women gather shells at low tide — the living room of coastal society.' },
      { ta: 'கழிமுகம்', en: 'Estuary / Backwater', desc: 'Where the river meets the sea — calm, brackish, teeming with fish; ringed with mangroves and neytal water lilies.' },
      { ta: 'மீன்படகு துறை', en: 'Fishing Harbour', desc: 'A protected inlet where catamarans (kattumaram) are tied; the smell of dried fish hangs over the settlement night and day.' },
      { ta: 'உப்புப் படுகை', en: 'Salt Pan', desc: 'Shallow tidal flats where sea water is channelled and left to evaporate, leaving crystalline white salt — a major coastal trade good.' },
      { ta: 'பவளப் படுகை', en: 'Coral Shoal', desc: 'Offshore coral reefs where pearl oysters are harvested by free-diving Paravar women; described in Sangam poems with awe and precision.' },
    ],

    flora: [
      { ta: 'நெய்தல்', en: 'Neytal (Blue Water Lily)', species: 'Nymphaea nouchali', desc: 'The namesake flower — deep blue petals in the backwater shallows at dawn. Its colour was compared to the eyes of the beloved in many Sangam poems.', emoji: '💙' },
      { ta: 'புன்னை', en: 'Punnai (Alexandrian Laurel)', species: 'Calophyllum inophyllum', desc: 'A coastal tree with glossy leaves and fragrant white flowers that carpet the beach; its oil was used in lamps on fishing boats.', emoji: '🌳' },
      { ta: 'தாழை', en: 'Thadavalam / Thaazhai (Screw Pine)', species: 'Pandanus tectorius', desc: 'Grows at the shore edge; its spiky leaves and sweet-smelling male cone used in coastal temple offerings.', emoji: '🌿' },
      { ta: 'கண்டல்', en: 'Kandal (Mangrove)', species: 'Rhizophora apiculata', desc: 'The ancient mangrove forest lining every estuary — nursery of fish, refuge of birds, and natural storm barrier.', emoji: '🌱' },
      { ta: 'சுரம்', en: 'Coastal Scrub', species: 'Ipomoea pes-caprae', desc: 'The beach morning glory — pink flowers crawling across the sand dunes, one of the hardiest plants in the coastal world.', emoji: '🌸' },
    ],

    fauna: [
      { ta: 'கடல்காகம்', en: 'Seagull', species: 'Larus spp.', desc: 'Riding the sea wind, crying above the waves — the sound and sight of the seagull is inseparable from neytal poetry and the ache of longing.', emoji: '🕊' },
      { ta: 'நாரை', en: 'Egret / Sea Heron', species: 'Egretta spp.', desc: 'White birds standing motionless in the shallow estuary; their stillness mirrors the waiting woman in poem after poem.', emoji: '🦢' },
      { ta: 'சுறா', en: 'Shark', species: 'Carcharhinus spp.', desc: 'The feared ruler of the deep; pearl divers offered prayers before plunging into waters shared with sharks. Sangam poems use the shark as a metaphor for formidable power.', emoji: '🦈' },
      { ta: 'நண்டு', en: 'Crab', species: 'Scylla serrata', desc: 'The mud crab of the estuary — dug from the banks at low tide; cooked with coconut on the beach fires of the Paravar.', emoji: '🦀' },
      { ta: 'திமிங்கிலம்', en: 'Sea Creature / Dolphin', species: 'Tursiops spp.', desc: 'The dolphin (called timinkilam or porpoise in Sangam texts) leaping alongside the kattumaram — a good omen for fishermen.', emoji: '🐬' },
    ],

    people: [
      { ta: 'பரதவர்', en: 'Paravar', role: 'Coastal fisher folk', desc: 'The ancient Tamil sea community — masters of the catamaran (kattumaram), expert pearl divers, and long-distance seafarers. Their patron deity was Varunan. They also controlled the conch and pearl trade.' },
      { ta: 'மீனவர்', en: 'Meenavr', role: 'Fishermen', desc: 'Inland river and coastal fishermen distinct from the deep-sea Paravar; their techniques — cast net, trap, and spear — are described in precise detail in Akananuru.' },
      { ta: 'உப்பு வணிகர்', en: 'Salt Merchants', role: 'Traders', desc: 'Transported salt by bullock cart inland; salt was a precious commodity and salt-roads were important trade routes crossing every tiṇai zone.' },
    ],

    music: [
      { ta: 'சங்கு', en: 'Conch Shell (Sangu)', desc: 'The great conch — blown to announce departures and arrivals of boats, at temples, in battle, and as a signal across the water. No coastal scene in Sangam poetry is without its resonant call.' },
      { ta: 'நெய்தல் யாழ்', en: 'Neytal Yazh (Coastal Harp)', desc: 'A smaller harp tuned to the neytal raga — melancholic, yearning, played by bards on the beach at dusk to lament separation.' },
      { ta: 'நெய்தல் பண்', en: 'Neytal Pann (Melody mode)', desc: 'The coastal raga — slow, swelling, receding like waves; the raga of grief and longing. Sung by women waiting on the shore.' },
    ],

    crafts: [
      { ta: 'முத்தெடுப்பு', en: 'Pearl Diving', desc: 'Paravar divers — often women — descended by rope to pry open oysters on the Korkai and Tuticorin shoals. Sangam poems describe the gleaming pearls as "tears of the sea."' },
      { ta: 'வலை நெசவு', en: 'Net Weaving', desc: 'Fishing nets woven by hand from coir and later cotton thread — repaired every evening after the catch; woven patterns were family secrets passed through generations.' },
      { ta: 'உப்பு தயாரிப்பு', en: 'Salt Making', desc: 'Sea water channelled into shallow clay-lined pans; after evaporation, the salt was raked, dried, and packed in palm-leaf bags for the inland trade.' },
    ],

    architecture: [
      { ta: 'கட்டுமரம்', en: 'Kattumaram (Catamaran)', desc: 'The ancient Tamil vessel — three logs of Punnai wood lashed together with coir, carrying a single sail. Fast, seaworthy, and beached easily in surf. The word "catamaran" is Tamil in origin.' },
      { ta: 'கடற்கரை நகரம்', en: 'Coastal Port Town', desc: 'Towns like Korkai and Poompuhar — busy with traders from Arabia, Greece, Rome, and Southeast Asia. Warehouses, taverns, and temples to Varunan and Murugan lined the waterfront.' },
    ],

    poetry: {
      classic: 'யான் நீர் வேண்டும் என்பவள் போல / புன்னை அம் கானல் பூ உக வண்டு ஊத',
      poem: 'Akananuru 100 — The bees scatter the punnai blossoms as if in grief; she stands on the beach, her anklets sounding her longing with each step.',
    },

    colors: { primary: 'from-blue-900 to-cyan-950', accent: 'text-blue-300', badge: 'bg-blue-900/50 text-blue-200', border: 'border-blue-700' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  palai: {
    id: 'palai',
    ta: 'பாலை',
    en: 'Wasteland & Desert Track',
    subEn: 'Sun-scorched paths of parting and endurance',
    emoji: '🏜',

    atmosphere: {
      season: { ta: 'வேனில் / முதுவேனில்', en: 'Midsummer & Late Summer', desc: 'The season of relentless heat — trees stripped of leaves, water sources dry, the ground cracked and hot. The landscape itself becomes an adversary.' },
      timeOfDay: { ta: 'நண்பகல்', en: 'Midday Blaze', desc: 'The fiercest hour — when vultures circle and the mirage shimmers. Even animals take shelter; only those driven by necessity travel at noon.' },
      weather: 'Scorching, dry; mirages on the horizon; dust devils; occasional hot wind (Kaatan)',
      sky: 'Bleached white at zenith; copper-tinged at the horizon; enormous and empty; the sun a burning disc',
      ambience: ['Bone-dry wind through leafless branches', 'Vulture cry', 'Creak of a caravan wagon', 'Crow calling from a dead tree', 'Eerie silence broken by a far tiger growl'],
    },

    deity: {
      ta: 'கொற்றவை / துர்க்கை',
      en: 'Korravai — Goddess of Victory & the Wild',
      desc: 'The fierce mother goddess of the wasteland — worshipped by the Maravar and Eyinar warrior clans who dominated the palai. She demanded blood sacrifice; her shrines were lone pillars in the wilderness where returning warriors left offerings.',
      symbol: 'Severed head · Drum · Tiger · Red Palai flower',
      epithets: ['Korravai (The Victor)', 'Venghai Amman', 'Katavul of the Wilderness', 'Durga (later identified with)'],
    },

    emotion: {
      akam: { ta: 'பிரிவு — வன்புறை', en: 'Forced separation & the agony of parting', desc: 'The husband must cross the wasteland for trade or war; the wife\'s anguish at this separation — and sometimes her decision to follow — is the central palai emotion.' },
      puram: { ta: 'போர் வீரம் / கொடை', en: 'Battle valor & kingly generosity', desc: 'The wasteland road is also the war road; palai poems celebrate warriors, raids, and the generosity of warrior kings who gave everything away.' },
    },

    landscape: [
      { ta: 'பாலைவனம்', en: 'Wasteland', desc: 'Cracked earth, sparse thorn scrub, leafless skeleton trees under a white sky — the palai is less a place than a state of absence: absence of water, shade, and safety.' },
      { ta: 'சுரம்', en: 'Desolate Road / Wild Path', desc: 'The road through the wasteland — barely a track, marked by wheel ruts and hero stones; bards sang warnings of its dangers to travellers.' },
      { ta: 'காட்டு வழி', en: 'Jungle Track', desc: 'Where the palai merges with overgrown forest; danger from tigers and bandits was real — escorts and weapons were essential.' },
      { ta: 'கல்லூர்', en: 'Rocky Upland', desc: 'Boulder-strewn plateaus where no crops grow; the domain of Korravai\'s worship and of the Eyinar hill-bandits.' },
    ],

    flora: [
      { ta: 'பாலை மரம்', en: 'Palai Tree (Wrightia)', species: 'Wrightia tinctoria', desc: 'The namesake tree of the wasteland — small, drought-resistant, with white flowers that ironically bloom beautifully in the driest season, contrasting their surroundings.', emoji: '🌼' },
      { ta: 'எருக்கு', en: 'Erukku (Calotropis)', species: 'Calotropis gigantea', desc: 'White crown-flowers on a sturdy succulent shrub; almost the only plant that thrives in the palai. Sacred to Korravai.', emoji: '⚪' },
      { ta: 'இலுப்பை', en: 'Mahua Tree', species: 'Madhuca longifolia', desc: 'Valued for its sweet flowers (eaten by tribal communities) and its oil-rich seeds; one of the few trees of the parched interior.', emoji: '🌳' },
      { ta: 'முள்ளம்', en: 'Acacia / Thorn Scrub', species: 'Acacia spp.', desc: 'Thorny acacia thickets that claw at travellers\' garments; their pods provide fodder for starving pack animals.', emoji: '🌵' },
    ],

    fauna: [
      { ta: 'புலி', en: 'Tiger', species: 'Panthera tigris', desc: 'The lord of the palai and the jungle track — feared, respected, and central to Sangam puram poetry. Its roar at midnight is one of the most frequent images in the whole corpus.', emoji: '🐅' },
      { ta: 'கழுகு', en: 'Vulture', species: 'Gyps bengalensis', desc: 'Circling in the thermals above the hot plain — the vulture\'s presence signals death nearby and appears as an omen of war in puram poems.', emoji: '🦅' },
      { ta: 'நரி', en: 'Jackal / Fox', species: 'Canis aureus', desc: 'Scavengers of the wasteland; their night howls accompany scenes of battle aftermath in Purananuru.', emoji: '🦊' },
      { ta: 'பாம்பு', en: 'Serpent', species: 'Naja naja / Daboia russelii', desc: 'The palai road is serpent country; the cobra shelters under rocks in the noon heat. Sangam poets use the serpent\'s presence to signal mortal danger.', emoji: '🐍' },
      { ta: 'காக்கை', en: 'Crow', species: 'Corvus macrorhynchos', desc: 'The crow picks the bones of the battlefield in puram poems; its harsh cry amid the silence of the wasteland is an emblem of desolation.', emoji: '🐦‍⬛' },
    ],

    people: [
      { ta: 'மறவர்', en: 'Maravar', role: 'Warrior clan', desc: 'The dominant community of the palai zone — fierce warriors, loyal retainers of Tamil kings, skilled archers. Their women too were celebrated for bravery; Purananuru includes elegies by Maravar women.' },
      { ta: 'எயினர்', en: 'Eyinar', role: 'Forest raiders', desc: 'Hunter-warrior bands of the rocky uplands; known for ambushes on trade caravans. Sometimes employed as irregular troops by kings; sometimes celebrated in poetry for their ferocity and rough generosity.' },
      { ta: 'வழிப்போக்கர்', en: 'Travellers', role: 'Merchants & pilgrims', desc: 'Those who crossed the palai out of necessity — merchants with wagons, pilgrims to distant shrines, exiles and the dispossessed. The palai poem is often told from their perspective.' },
    ],

    music: [
      { ta: 'படகம்', en: 'Padagam (War Drum)', desc: 'A large cylindrical drum beaten before battle and when a king set out on campaign; its boom carried across the wasteland and was used to intimidate enemies.' },
      { ta: 'பாலைப் பண்', en: 'Palai Pann (Melody mode)', desc: 'The raga of separation — stark, austere, built on wide melodic leaps like the vast empty landscape. Associated with grief, long journeys, and the inevitability of parting.' },
      { ta: 'வீரப் பாட்டு', en: 'Vira Pattu (Hero Song)', desc: 'Songs sung by bards to inspire warriors before battle or to lament fallen heroes — the bards of the palai (panar and viraliyar) are depicted travelling the wasteland roads.' },
    ],

    crafts: [
      { ta: 'வில் வினை', en: 'Bow-making', desc: 'The Maravar and Eyinar were expert bow makers — recurve bows of bamboo or wood, strung with sinew and decorated with palm-leaf patterns.' },
      { ta: 'கவசம் செய்தல்', en: 'Armour Crafting', desc: 'Leather armour made from tiger and buffalo hide; shields of elephant hide; decorated helmets. The metalwork included iron tips for arrows and spears.' },
    ],

    architecture: [
      { ta: 'நடுகல்', en: 'Nadukal (Hero Stone)', desc: 'Tall standing stones erected at spots where warriors fell — carved with the hero\'s weapon, the battle scene, and inscribed with his name. Venerated as the hero\'s spirit-home. The most archaeologically abundant monument of the Sangam world.' },
      { ta: 'கொற்றவை கோட்டம்', en: 'Korravai Shrine', desc: 'A blood-red painted stone in a lone clearing, hung with skulls and red cloth; offerings of meat and liquor left by warriors before raids.' },
      { ta: 'வழிச் சத்திரம்', en: 'Waystation', desc: 'Simple stone shelters at day-march intervals on the wasteland roads, stocked with water pots by pious donors; one of the most praised acts of charity in puram poetry.' },
    ],

    poetry: {
      classic: 'அழல் அவிர் உருப்பின் ஆய் கதிர் திகழ / கொழு நிழல் கரந்த வெம்மை / நிழல் அற்று அலமரும் பகல் வெய்யோற்கு',
      poem: 'Purananuru 68 — The midday sun stripped every shadow from the wasteland. On that track, my lord walked — and did not look back.',
    },

    colors: { primary: 'from-orange-900 to-red-950', accent: 'text-orange-300', badge: 'bg-orange-900/50 text-orange-200', border: 'border-orange-700' },
  },
}

/** Quick array form for iteration */
export const TINAI_LIST = Object.values(TINAI_WORLD)
