/**
 * src/data/tinaiData.ts
 *
 * Data model and dataset for the five Sangam "Tinai" (landscapes):
 * Kurinji, Mullai, Marutham, Neithal, and Palai.
 *
 * Each Tinai represents a distinct ecological and emotional landscape
 * from classical Tamil Sangam poetics, associated with a specific
 * human mood (uri), deity, flora, fauna, and way of life.
 */

export type TinaiId = "kurinji" | "mullai" | "marutham" | "neithal" | "palai";

export interface TinaiData {
  /** Stable unique identifier used for routing, ARIA ids, and video lookup */
  id: TinaiId;
  /** Display name of the Tinai in English transliteration */
  name: string;
  /** Native Tamil script name */
  tamilName: string;
  /** The physical landscape type this Tinai represents */
  landscapeType: string;
  /** The core emotional / poetic symbolism associated with this Tinai */
  symbolism: string;
  /** A longer descriptive paragraph about the Tinai */
  description: string;
  /** Representative flora of the region */
  flora: string[];
  /** Representative fauna of the region */
  fauna: string[];
  /** Typical occupation and cultural activities of inhabitants */
  occupation: string;
  /** Notable customs and traditions tied to the landscape */
  traditions: string;
  /** Characteristic cuisine of the region */
  cuisine: string;
  /** The associated Pann (classical Tamil musical mode) */
  music: string;
  /** Typical climate of the landscape */
  climate: string;
  /** Presiding deity associated with the Tinai */
  deity: string;
  /** Path to the hero video asset, relative to /public */
  videoSrc: string;
  /** Accent color token used for card theming (Tailwind-friendly hex) */
  accentColor: string;
}

export const tinaiData: TinaiData[] = [
  {
    id: "kurinji",
    name: "Kurinji",
    tamilName: "குறிஞ்சி",
    landscapeType: "Mountains and hill country",
    symbolism: "Union and the first flush of romantic love",
    description:
      "Kurinji is the mountainous landscape of the Sangam world, named after the Kurinji flower that blooms once in twelve years. It is the setting for poems of first love, secret meetings, and the thrill of union between lovers, set against misty hills, waterfalls, and dense forests.",
    flora: ["Kurinji flower", "Bamboo", "Jackfruit", "Venkai tree", "Wild honey combs"],
    fauna: ["Elephants", "Monkeys", "Peacocks", "Wild boar", "Hill mynas"],
    occupation: "Hill cultivation, honey gathering, and hunting",
    traditions:
      "Communities practiced shifting hill cultivation and celebrated harvest with drum dances; courtship rituals often unfolded during guarding of millet fields at night.",
    cuisine: "Millet-based porridges, wild honey, roasted tubers, and forest fruits",
    music: "Nathapann",
    climate: "Cool, misty, and rain-fed mountain climate",
    deity: "Murugan",
    videoSrc: "/videos/kurinji.mp4",
    accentColor: "#a855f7",
  },
  {
    id: "mullai",
    name: "Mullai",
    tamilName: "முல்லை",
    landscapeType: "Forests and pastoral woodlands",
    symbolism: "Patient waiting and the trust of a devoted wife",
    description:
      "Mullai is the forest and pastoral landscape, named after the jasmine creeper that flowers in the rains. It embodies themes of patient waiting, quiet domestic devotion, and the anticipated return of a husband from a distant journey or war.",
    flora: ["Mullai jasmine", "Konrai tree", "Bamboo groves", "Wild jackfruit", "Grasslands"],
    fauna: ["Cattle", "Deer", "Rabbits", "Wild fowl", "Cicadas"],
    occupation: "Cattle rearing, shifting agriculture, and dairy work",
    traditions:
      "Pastoral communities held cattle festivals and evening gatherings around communal fires, with songs of longing sung while tending herds.",
    cuisine: "Milk, curd, ghee-based dishes, millet cakes, and forest greens",
    music: "Mullaipann",
    climate: "Moderate rainfall with lush green forest cover",
    deity: "Mayon (Vishnu)",
    videoSrc: "/videos/mullai.mp4",
    accentColor: "#22c55e",
  },
  {
    id: "marutham",
    name: "Marutham",
    tamilName: "மருதம்",
    landscapeType: "Fertile agricultural plains and river valleys",
    symbolism: "Marital conflict, jealousy, and eventual reconciliation",
    description:
      "Marutham is the fertile riverine plain, named after the Marutham tree that lines its waterways. Its poems explore the tensions of married life, including infidelity, jealousy between wife and courtesan, and the reconciliation that follows.",
    flora: ["Marutham tree", "Paddy fields", "Water lilies", "Sugarcane", "Coconut palms"],
    fauna: ["Fish", "Water buffalo", "Egrets", "Otters", "Ducks"],
    occupation: "Wet-rice paddy farming and irrigation-based agriculture",
    traditions:
      "Villages organized around temple tanks and canals, with seasonal harvest festivals, boat races, and communal irrigation labor.",
    cuisine: "Rice-based meals, sambar, fish curry, and river vegetables",
    music: "Marutham pann",
    climate: "Warm and humid with abundant river water",
    deity: "Indra",
    videoSrc: "/videos/marutham.mp4",
    accentColor: "#eab308",
  },
  {
    id: "neithal",
    name: "Neithal",
    tamilName: "நெய்தல்",
    landscapeType: "Coastal shores and seaside villages",
    symbolism: "Separation, anxious waiting, and longing by the sea",
    description:
      "Neithal is the coastal landscape, named after the blue water lily found in its lagoons. Its verses center on the anxious separation of lovers, often a woman waiting on the shore while her beloved is away at sea for trade or fishing.",
    flora: ["Neithal water lily", "Screw pine", "Coconut palms", "Mangroves", "Sea grapes"],
    fauna: ["Fish", "Crabs", "Sea gulls", "Turtles", "Prawns"],
    occupation: "Fishing, salt panning, and maritime trade",
    traditions:
      "Coastal communities held rituals for safe sea voyages and celebrated fish harvests, with women often depicted anxiously watching the horizon.",
    cuisine: "Fresh seafood, fish curry, salted fish preparations, and coconut-based dishes",
    music: "Neithal pann",
    climate: "Humid, salty sea breeze with tropical coastal warmth",
    deity: "Varunan",
    videoSrc: "/videos/neithal.mp4",
    accentColor: "#0ea5e9",
  },
  {
    id: "palai",
    name: "Palai",
    tamilName: "பாலை",
    landscapeType: "Arid drylands and desert wilderness",
    symbolism: "Hardship of separation and perilous journeys",
    description:
      "Palai is the parched, arid landscape symbolizing separation caused by a hero's journey through dangerous drylands in pursuit of wealth, war, or duty. It represents the harshest emotional terrain among the five Tinais, born when Mullai and Kurinji dry up in summer.",
    flora: ["Palai shrub", "Cactus", "Thorny acacia", "Dry grass", "Withered palms"],
    fauna: ["Wolves", "Vultures", "Wild donkeys", "Snakes", "Scorpions"],
    occupation: "Traveling trade caravans, banditry, and cattle raiding",
    traditions:
      "Wayside travelers and bards depended on scarce watering holes, with poetry reflecting the peril and endurance required to cross the wasteland.",
    cuisine: "Dried grains, preserved meats, and minimal-water travel rations",
    music: "Paalai pann",
    climate: "Hot, dry, and drought-prone with scarce water",
    deity: "Korravai",
    videoSrc: "/videos/palai.mp4",
    accentColor: "#f97316",
  },
];

export const getTinaiById = (id: TinaiId): TinaiData => {
  const found = tinaiData.find((t) => t.id === id);
  if (!found) {
    throw new Error(`Tinai with id "${id}" not found in dataset.`);
  }
  return found;
};

export const defaultTinaiId: TinaiId = "kurinji";
