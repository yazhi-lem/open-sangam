/**
 * TinaiLandscape — immersive CSS/SVG animated landscape hero for each Tiṇai zone.
 * Renders sky, terrain, flora silhouettes, and ambient icons that define the zone.
 */

const SCENES = {
  kurinji: {
    sky: 'from-indigo-950 via-purple-950 to-slate-900',
    groundFar: 'fill-indigo-900',
    groundNear: 'fill-purple-950',
    groundFront: 'fill-slate-950',
    particles: [
      { char: '🌸', label: 'Kurinji blossom', positions: ['15%', '35%', '55%', '75%', '88%'], topRange: [20, 55] },
      { char: '🦚', label: 'Peacock', positions: ['25%', '65%'], topRange: [55, 72] },
    ],
    svgPeaks: [
      'M0,160 L60,60 L120,100 L180,40 L240,80 L300,20 L360,70 L420,50 L480,90 L540,30 L600,80 L640,160 Z',
      'M0,160 L80,100 L160,70 L220,110 L280,50 L340,90 L400,60 L460,100 L520,75 L580,110 L640,160 Z',
    ],
    silhouettes: [
      { d: 'M50,160 Q55,120 60,80 Q62,70 64,80 Q66,70 68,80 Q70,120 75,160 Z', fill: '#1e1b4b' },
      { d: 'M130,160 L138,90 Q142,70 146,90 L154,160 Z', fill: '#1e1b4b' },
      { d: 'M300,160 Q308,100 312,60 Q316,100 320,160 Z', fill: '#1e1b4b' },
      { d: 'M430,160 L440,85 Q444,65 448,85 L458,160 Z', fill: '#1e1b4b' },
      { d: 'M530,160 Q538,110 542,75 Q546,110 550,160 Z', fill: '#1e1b4b' },
    ],
    waterfall: { x: 220, label: 'Waterfall' },
    timeLabel: 'யாமம் · Midnight',
    seasonLabel: 'கூதிர் · Winter Mist',
    ambientColor: 'text-purple-300',
    ringColor: 'ring-purple-500/30',
    glow: 'shadow-purple-900/60',
  },

  mullai: {
    sky: 'from-emerald-950 via-green-950 to-slate-900',
    groundFar: 'fill-green-900',
    groundNear: 'fill-emerald-950',
    groundFront: 'fill-slate-950',
    particles: [
      { char: '🌿', label: 'Mullai leaf', positions: ['10%', '30%', '50%', '70%', '90%'], topRange: [30, 60] },
      { char: '🐦', label: 'Koel', positions: ['20%', '60%', '80%'], topRange: [25, 45] },
    ],
    svgPeaks: [
      'M0,160 Q60,80 120,100 Q180,120 240,70 Q300,40 360,80 Q420,110 480,60 Q540,30 600,80 L640,160 Z',
      'M0,160 Q80,120 160,90 Q240,70 320,100 Q400,120 480,85 Q560,60 640,160 Z',
    ],
    silhouettes: [
      { d: 'M20,160 Q28,110 36,60 Q44,30 52,60 Q56,110 62,160 Z', fill: '#14532d' },
      { d: 'M90,160 Q96,115 102,75 Q106,55 110,75 Q114,115 120,160 Z', fill: '#14532d' },
      { d: 'M200,160 Q206,120 212,80 Q216,60 220,80 Q224,120 230,160 Z', fill: '#14532d' },
      { d: 'M360,160 Q365,105 370,60 Q374,40 378,60 Q382,105 388,160 Z', fill: '#14532d' },
      { d: 'M490,160 Q496,110 502,70 Q506,50 510,70 Q514,110 520,160 Z', fill: '#14532d' },
      { d: 'M570,160 Q576,120 582,80 Q586,60 590,80 Q594,120 600,160 Z', fill: '#14532d' },
    ],
    timeLabel: 'மாலை · Dusk',
    seasonLabel: 'கார் · Monsoon',
    ambientColor: 'text-green-300',
    ringColor: 'ring-green-500/30',
    glow: 'shadow-green-900/60',
  },

  marutam: {
    sky: 'from-amber-950 via-yellow-900 to-orange-950',
    groundFar: 'fill-yellow-900',
    groundNear: 'fill-amber-950',
    groundFront: 'fill-stone-950',
    particles: [
      { char: '🌾', label: 'Paddy', positions: ['8%', '22%', '38%', '52%', '68%', '82%', '94%'], topRange: [55, 72] },
      { char: '🦢', label: 'Crane', positions: ['30%', '55%', '75%'], topRange: [35, 52] },
    ],
    svgPeaks: [
      'M0,160 Q100,140 200,145 Q300,148 400,142 Q500,138 640,145 L640,160 Z',
      'M0,160 Q80,150 160,148 Q300,145 450,150 Q550,152 640,148 L640,160 Z',
    ],
    silhouettes: [
      { d: 'M15,160 Q18,140 22,120 Q26,100 28,95 Q30,100 32,120 Q36,140 40,160 Z', fill: '#78350f' },
      { d: 'M110,160 Q113,130 116,105 Q118,90 120,85 Q122,90 124,105 Q127,130 130,160 Z', fill: '#78350f' },
      { d: 'M250,160 Q255,138 260,118 Q264,100 266,95 Q268,100 270,118 Q274,138 278,160 Z', fill: '#78350f' },
      { d: 'M430,160 Q434,136 438,112 Q440,96 442,90 Q444,96 446,112 Q450,136 453,160 Z', fill: '#78350f' },
      { d: 'M560,160 Q563,135 566,110 Q568,95 570,90 Q572,95 574,110 Q577,135 580,160 Z', fill: '#78350f' },
    ],
    timeLabel: 'வைகறை · Dawn',
    seasonLabel: 'இலையுதிர் · Harvest',
    ambientColor: 'text-yellow-300',
    ringColor: 'ring-yellow-500/30',
    glow: 'shadow-yellow-900/60',
  },

  neytal: {
    sky: 'from-blue-950 via-cyan-950 to-slate-900',
    groundFar: 'fill-blue-900',
    groundNear: 'fill-cyan-950',
    groundFront: 'fill-slate-950',
    particles: [
      { char: '🌊', label: 'Wave', positions: ['5%', '20%', '40%', '60%', '78%', '92%'], topRange: [48, 62] },
      { char: '🕊', label: 'Gull', positions: ['15%', '45%', '70%', '85%'], topRange: [20, 42] },
    ],
    svgPeaks: [
      'M0,100 Q80,80 160,90 Q240,100 320,85 Q400,70 480,88 Q560,100 640,90 L640,160 L0,160 Z',
      'M0,130 Q80,115 180,125 Q280,135 380,118 Q480,105 580,120 L640,128 L640,160 L0,160 Z',
    ],
    silhouettes: [
      { d: 'M30,160 Q35,130 40,105 Q42,95 44,90 Q46,95 48,105 Q52,130 56,160 Z', fill: '#0c4a6e' },
      { d: 'M160,160 Q164,132 168,110 Q170,100 172,95 Q174,100 176,110 Q180,132 184,160 Z', fill: '#0c4a6e' },
      { d: 'M400,160 Q406,128 412,105 Q414,95 416,90 Q418,95 420,105 Q424,128 428,160 Z', fill: '#0c4a6e' },
      { d: 'M560,160 Q565,135 570,115 Q572,105 574,100 Q576,105 578,115 Q582,135 586,160 Z', fill: '#0c4a6e' },
    ],
    waves: true,
    timeLabel: 'அந்தி மாலை · Twilight',
    seasonLabel: 'வெயில் · Coastal Heat',
    ambientColor: 'text-blue-300',
    ringColor: 'ring-blue-500/30',
    glow: 'shadow-blue-900/60',
  },

  palai: {
    sky: 'from-orange-950 via-red-950 to-stone-900',
    groundFar: 'fill-orange-900',
    groundNear: 'fill-red-950',
    groundFront: 'fill-stone-950',
    particles: [
      { char: '☀', label: 'Scorching sun', positions: ['50%'], topRange: [5, 8] },
      { char: '🦅', label: 'Vulture', positions: ['25%', '60%', '82%'], topRange: [15, 35] },
    ],
    svgPeaks: [
      'M0,160 Q120,130 200,135 Q280,138 360,130 Q440,122 520,130 Q580,135 640,130 L640,160 Z',
      'M0,160 Q80,148 160,145 Q280,140 400,147 Q520,152 640,145 L640,160 Z',
    ],
    silhouettes: [
      { d: 'M25,160 L30,135 Q32,120 34,115 L36,120 Q38,130 40,160 Z', fill: '#431407' },
      { d: 'M80,160 L84,138 Q86,125 88,120 L90,126 Q92,138 96,160 Z', fill: '#431407' },
      { d: 'M200,160 L204,130 Q206,118 208,112 L210,118 Q212,130 215,160 Z', fill: '#431407' },
      { d: 'M340,160 L344,132 Q346,120 348,115 L350,120 Q352,132 356,160 Z', fill: '#431407' },
      { d: 'M490,160 L494,128 Q496,115 498,110 L500,115 Q502,128 506,160 Z', fill: '#431407' },
      { d: 'M590,160 L594,135 Q596,122 598,116 L600,122 Q602,135 606,160 Z', fill: '#431407' },
    ],
    timeLabel: 'நண்பகல் · Blazing Noon',
    seasonLabel: 'வேனில் · Scorching Summer',
    ambientColor: 'text-orange-300',
    ringColor: 'ring-orange-500/30',
    glow: 'shadow-orange-900/60',
  },
}

function WaveLayer() {
  return (
    <g opacity="0.4">
      <path d="M0,50 Q40,40 80,50 Q120,60 160,50 Q200,40 240,50 Q280,60 320,50 Q360,40 400,50 Q440,60 480,50 Q520,40 560,50 Q600,60 640,50 L640,80 L0,80 Z" fill="#0369a1" />
      <path d="M0,65 Q50,55 100,65 Q150,75 200,65 Q250,55 300,65 Q350,75 400,65 Q450,55 500,65 Q550,75 600,65 L640,70 L640,95 L0,95 Z" fill="#0c4a6e" />
    </g>
  )
}

export default function TinaiLandscape({ tinaiId }) {
  const scene = SCENES[tinaiId]
  if (!scene) return null

  const farPeak = scene.svgPeaks[0]
  const nearPeak = scene.svgPeaks[1]

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border ${scene.ringColor} ring-1 shadow-2xl ${scene.glow}`}
      style={{ height: '220px' }}
      role="img"
      aria-label={`${tinaiId} landscape`}
    >
      {/* Sky gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${scene.sky}`} />

      {/* Stars overlay for night scenes */}
      {tinaiId === 'kurinji' && (
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 20%, white, transparent), radial-gradient(1px 1px at 40% 10%, white, transparent), radial-gradient(1px 1px at 60% 25%, white, transparent), radial-gradient(1px 1px at 80% 15%, white, transparent), radial-gradient(1px 1px at 10% 35%, white, transparent), radial-gradient(1px 1px at 90% 30%, white, transparent), radial-gradient(1px 1px at 50% 8%, white, transparent)'
        }} />
      )}

      {/* Sun for palai */}
      {tinaiId === 'palai' && (
        <div className="absolute rounded-full bg-orange-300 opacity-90 shadow-lg"
          style={{ width: 40, height: 40, top: '10%', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 40px 20px rgba(251,146,60,0.3)' }}
        />
      )}

      {/* SVG landscape */}
      <svg
        viewBox="0 0 640 160"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '140px' }}
        aria-hidden="true"
      >
        {/* Far terrain */}
        <path d={farPeak} className={scene.groundFar} opacity="0.7" />

        {/* Waves for neytal */}
        {scene.waves && <WaveLayer />}

        {/* Silhouette elements (trees / reeds / cacti) */}
        {scene.silhouettes.map((s, i) => (
          <path key={i} d={s.d} fill={s.fill} />
        ))}

        {/* Near terrain */}
        <path d={nearPeak} className={scene.groundNear} opacity="0.9" />

        {/* Front ground strip */}
        <rect x="0" y="148" width="640" height="12" className={scene.groundFront} />
      </svg>

      {/* Floating particles */}
      {scene.particles.map((group) =>
        group.positions.map((left, i) => {
          const top = group.topRange[0] + Math.floor(
            ((i * 37 + group.topRange[0]) % (group.topRange[1] - group.topRange[0]))
          )
          return (
            <span
              key={`${group.label}-${i}`}
              className="absolute select-none"
              style={{
                left,
                top: `${top}%`,
                fontSize: group.char === '☀' ? '28px' : group.char === '🌾' ? '18px' : '20px',
                opacity: 0.8,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
              aria-hidden="true"
            >
              {group.char}
            </span>
          )
        })
      )}

      {/* Zone label overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
        <div className="space-y-0.5">
          <p className={`text-[10px] font-medium uppercase tracking-[0.15em] ${scene.ambientColor}`}>
            {scene.timeLabel}
          </p>
          <p className="text-[10px] text-stone-500 tracking-wide">{scene.seasonLabel}</p>
        </div>
      </div>
    </div>
  )
}
