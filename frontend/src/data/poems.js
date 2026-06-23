// Sangam poem registry — mirrors backend/python/scraper/registry.py
// available: true means the normalized JSON exists and can be loaded

export const COLLECTIONS = {
  '8thokai': { ta: 'எட்டுத்தொகை', en: 'Eight Anthologies', desc: 'Eight classical Tamil poetic anthologies spanning the akam (interior) and puram (exterior) traditions.' },
  '10paddu': { ta: 'பத்துப்பாட்டு', en: 'Ten Idylls', desc: 'Ten long poems celebrating kings, cities, and the Tamil landscape in elaborate verse.' },
}

export const POEMS = [
  // ── Eight Anthologies ──────────────────────────────────────────────────
  {
    id: 'natrinai',
    ta: 'நற்றிணை', en: 'Natrinai',
    collection: '8thokai',
    count: 400, unit: 'poems',
    tinai: ['kurinji', 'mullai', 'marutam', 'neytal', 'palai'],
    available: true,
    loader: () => import('@data/texts/natrinai/natrinai.json'),
  },
  {
    id: 'kurunthokai',
    ta: 'குறுந்தொகை', en: 'Kurunthokai',
    collection: '8thokai',
    count: 400, unit: 'poems',
    tinai: ['kurinji', 'mullai', 'marutam', 'neytal', 'palai'],
    available: false,
  },
  {
    id: 'ainkurunooru',
    ta: 'ஐங்குறுநூறு', en: 'Ainkurunooru',
    collection: '8thokai',
    count: 500, unit: 'poems',
    tinai: ['kurinji', 'mullai', 'marutam', 'neytal', 'palai'],
    available: false,
  },
  {
    id: 'kalithokai',
    ta: 'கலித்தொகை', en: 'Kalithokai',
    collection: '8thokai',
    count: 150, unit: 'poems',
    tinai: ['kurinji', 'mullai', 'marutam', 'neytal', 'palai'],
    available: false,
  },
  {
    id: 'akananooru',
    ta: 'அகநானூறு', en: 'Akananooru',
    collection: '8thokai',
    count: 400, unit: 'poems',
    tinai: ['kurinji', 'mullai', 'marutam', 'neytal', 'palai'],
    available: false,
  },
  {
    id: 'pathitrupathu',
    ta: 'பதிற்றுப்பத்து', en: 'Pathitrupathu',
    collection: '8thokai',
    count: 80, unit: 'poems',
    tinai: ['puram'],
    available: false,
  },
  {
    id: 'purananooru',
    ta: 'புறநானூறு', en: 'Purananuru',
    collection: '8thokai',
    count: 400, unit: 'poems',
    tinai: ['puram'],
    available: true,
    loader: () => import('@data/texts/purananooru/purananooru.json'),
  },
  {
    id: 'paripadal',
    ta: 'பரிபாடல்', en: 'Paripadal',
    collection: '8thokai',
    count: 22, unit: 'poems',
    tinai: ['kurinji', 'marutam'],
    available: false,
  },

  // ── Ten Idylls ──────────────────────────────────────────────────────────
  {
    id: 'thirumurugatrupadai',
    ta: 'திருமுருகாற்றுப்படை', en: 'Tirumurugaatrupadai',
    collection: '10paddu',
    count: 317, unit: 'lines',
    available: false,
  },
  {
    id: 'sirupanatrupadai',
    ta: 'சிறுபாணாற்றுப்படை', en: 'Sirupanatrupadai',
    collection: '10paddu',
    count: 269, unit: 'lines',
    available: false,
  },
  {
    id: 'perumpanatrupadai',
    ta: 'பெரும்பாணாற்றுப்படை', en: 'Perumpanatrupadai',
    collection: '10paddu',
    count: 500, unit: 'lines',
    available: false,
  },
  {
    id: 'malaipadukadam',
    ta: 'மலைபடுகடாம்', en: 'Malaipadukadam',
    collection: '10paddu',
    count: 583, unit: 'lines',
    available: false,
  },
  {
    id: 'maduraikanchi',
    ta: 'மதுரைக்காஞ்சி', en: 'Maduraikanchi',
    collection: '10paddu',
    count: 782, unit: 'lines',
    available: true,
    loader: () => import('@data/texts/maduraikanchi/maduraikanchi.json'),
  },
  {
    id: 'kurinjipattu',
    ta: 'குறிஞ்சிப்பாட்டு', en: 'Kurinjipattu',
    collection: '10paddu',
    count: 261, unit: 'lines',
    available: false,
  },
  {
    id: 'pattinappalai',
    ta: 'பட்டினப்பாலை', en: 'Pattinappalai',
    collection: '10paddu',
    count: 301, unit: 'lines',
    available: false,
  },
  {
    id: 'mullaippattu',
    ta: 'முல்லைப்பாட்டு', en: 'Mullaippattu',
    collection: '10paddu',
    count: 103, unit: 'lines',
    available: false,
  },
  {
    id: 'nedunalvadai',
    ta: 'நெடுநல்வாடை', en: 'Nedunalvadai',
    collection: '10paddu',
    count: 188, unit: 'lines',
    available: false,
  },
]

export const POEM_BY_ID = Object.fromEntries(POEMS.map(p => [p.id, p]))

export const TINAI_COLORS = {
  kurinji: 'text-violet-600 bg-violet-50',
  mullai:  'text-green-700 bg-green-50',
  marutam: 'text-teal-700 bg-teal-50',
  neytal:  'text-blue-600 bg-blue-50',
  palai:   'text-amber-700 bg-amber-50',
  puram:   'text-rose-700 bg-rose-50',
}
