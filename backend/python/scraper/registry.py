"""
registry.py
-----------
All Sangam poems available on sangathamizh.com with their metadata.

Each entry describes one poem and tells the scraper:
  - where to find the index page
  - how links are structured (subfolder/filename pattern)
  - whether it is verse-based (8thokai) or section-based (10paddu)
"""

POEMS = [
    # ── Eight Anthologies (Ettuttokai) ─── verse-based, one page per poem ──
    {
        "id": "natrinai",
        "title_ta": "நற்றிணை",
        "title_en": "Natrinai",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-natrinai-நற்றிணை.html",
        "subfolder": "natrinai",
        "num_digits": 3,       # zero-padded digits in filename, e.g. 001
        "tinai_source": "link",  # tinai extracted from link label text
    },
    {
        "id": "kurunthokai",
        "title_ta": "குறுந்தொகை",
        "title_en": "Kurunthokai",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-kurunthokai-குறுந்தொகை.html",
        "subfolder": "kurunthokai",
        "num_digits": 3,
        "tinai_source": "link",
    },
    {
        "id": "ainkurunooru",
        "title_ta": "ஐங்குறுநூறு",
        "title_en": "Ainkurunooru",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-ainkurunooru-ஐங்குறுநூறு.html",
        "subfolder": "ainkurunooru",
        "num_digits": 3,
        "tinai_source": "link",
    },
    {
        "id": "kalithokai",
        "title_ta": "கலித்தொகை",
        "title_en": "Kalithokai",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-kalithokai-கலித்தொகை.html",
        "subfolder": "kalithokai",
        "num_digits": 3,
        "tinai_source": "link",
    },
    {
        "id": "akananooru",
        "title_ta": "அகநானூறு",
        "title_en": "Akananooru",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-akananooru-அகநானூறு.html",
        "subfolder": "akananooru",
        "num_digits": 3,
        "tinai_source": "link",
    },
    {
        "id": "pathitrupathu",
        "title_ta": "பதிற்றுப்பத்து",
        "title_en": "Pathitrupathu",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-pathitrupathu-பதிற்றுப்பத்து.html",
        "subfolder": "pathitrupathu",
        "num_digits": 2,
        "tinai_source": "link",
    },
    {
        "id": "purananooru",
        "title_ta": "புறநானூறு",
        "title_en": "Purananuru",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-purananooru-புறநானூறு.html",
        "subfolder": "purananooru",
        "num_digits": 3,
        "tinai_source": "link",
    },
    {
        "id": "paripadal",
        "title_ta": "பரிபாடல்",
        "title_en": "Paripadal",
        "collection": "8thokai",
        "index_url": "http://www.sangathamizh.com/8thokai/8thokai-paripadal-பரிபாடல்.html",
        "subfolder": "paripadal",
        "num_digits": 2,
        "tinai_source": "link",
    },

    # ── Ten Idylls (Pattuppattu) ─── section-based, one page per passage ──
    {
        "id": "thirumurugatrupadai",
        "title_ta": "திருமுருகாற்றுப்படை",
        "title_en": "Tirumurugaatrupadai",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-thirumurugatrupadai-திருமுருகாற்றுப்படை.html",
        "subfolder": "thirumurugatrupadai",
        "num_digits": 2,
        "tinai_source": "kanci",   # whole poem is one tinai
    },
    # Porunaratrupadai is 404 on the site — skipped
    {
        "id": "sirupanatrupadai",
        "title_ta": "சிறுபாணாற்றுப்படை",
        "title_en": "Sirupanatrupadai",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-sirupanatruppadai-சிறுபாணாற்றுப்படை.html",
        "subfolder": "sirupanatruppadai",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
    {
        "id": "perumpanatrupadai",
        "title_ta": "பெரும்பாணாற்றுப்படை",
        "title_en": "Perumpanatrupadai",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-perumpanatruppadai-பெரும்பாணாற்றுப்படை.html",
        "subfolder": "perumpanatruppadai",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
    {
        "id": "malaipadukadam",
        "title_ta": "மலைபடுகடாம்",
        "title_en": "Malaipadukadam",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-malaipadukadam-மலைபடுகடாம்.html",
        "subfolder": "malaipadukadam",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
    # maduraikanchi already done — included here so the registry is complete
    {
        "id": "maduraikanchi",
        "title_ta": "மதுரைக்காஞ்சி",
        "title_en": "Maduraikanchi",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-mathuraikaanchi-மதுரைக்காஞ்சி.html",
        "subfolder": "mathuraikaanchi",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
    {
        "id": "kurinjipattu",
        "title_ta": "குறிஞ்சிப்பாட்டு",
        "title_en": "Kurinjipattu",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-nedunalvadai-குறிஞ்சிப்பாட்டு.html",
        "subfolder": "kurinchippattu",
        "num_digits": 2,
        "tinai_source": "kurinji",
    },
    {
        "id": "pattinappalai",
        "title_ta": "பட்டினப்பாலை",
        "title_en": "Pattinappalai",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-paddinappalai-பட்டினப்பாலை.html",
        "subfolder": "paddinappalai",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
    {
        "id": "mullaippattu",
        "title_ta": "முல்லைப்பாட்டு",
        "title_en": "Mullaippattu",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-mullaippattu-முல்லைப்பாட்டு.html",
        "subfolder": "mullaippattu",
        "num_digits": 2,
        "tinai_source": "mullai",
    },
    {
        "id": "nedunalvadai",
        "title_ta": "நெடுநல்வாடை",
        "title_en": "Nedunalvadai",
        "collection": "10paddu",
        "index_url": "http://www.sangathamizh.com/10paddu/10paddu-nedunalvadai-நெடுநல்வாடை.html",
        "subfolder": "nedunalvadai",
        "num_digits": 2,
        "tinai_source": "kanci",
    },
]

# Quick lookup by id
POEM_BY_ID = {p["id"]: p for p in POEMS}

# Canonical tinai label → schema value
TINAI_MAP = {
    "குறிஞ்சி": "kurinji",
    "முல்லை": "mullai",
    "மருதம்": "marutam",
    "நெய்தல்": "neytal",
    "பாலை": "palai",
    "கலி": "unknown",
    "பரி": "unknown",
    "kurinji": "kurinji",
    "mullai": "mullai",
    "marutam": "marutam",
    "neytal": "neytal",
    "palai": "palai",
    "kanci": "unknown",     # Kanci tinai = morality/impermanence, mapped to unknown
}
