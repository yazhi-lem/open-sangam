/**
 * src/components/TinaiShowcase/TinaiShowcaseSection.tsx
 *
 * Main layout component for the "Tinai Showcase" section. Binds together:
 *  - TinaiVideoHero: the crossfading full-width video player
 *  - TinaiCard grid: the 5-card tablist selector
 *  - Content Synchronization Panel: metadata panel synced to the active Tinai
 *
 * State (the active Tinai id) lives here as the single source of truth so
 * the video hero, card grid, and metadata panel always stay in sync.
 */

import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { tinaiData, defaultTinaiId, type TinaiId, type TinaiData } from "../../data/tinaiData";
import TinaiVideoHero from "./TinaiVideoHero";
import TinaiCard from "./TinaiCard";

/** A single labeled row inside the synchronization panel, e.g. "Flora: ..." */
const MetaRow: React.FC<{ label: string; value: string | string[] }> = React.memo(
  ({ label, value }) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        {label}
      </dt>
      <dd className="text-sm text-slate-200">
        {Array.isArray(value) ? value.join(", ") : value}
      </dd>
    </div>
  )
);
MetaRow.displayName = "MetaRow";

const TinaiContentPanel: React.FC<{ tinai: TinaiData }> = React.memo(({ tinai }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md"
      role="tabpanel"
      id={`tinai-content-${tinai.id}`}
      aria-labelledby={`tinai-tab-${tinai.id}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={tinai.id}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.35, ease: "easeInOut" }}
        >
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-2xl font-bold text-amber-100">{tinai.name}</h3>
            <span className="text-lg text-amber-200/70">{tinai.tamilName}</span>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-slate-300">{tinai.description}</p>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetaRow label="Landscape" value={tinai.landscapeType} />
            <MetaRow label="Symbolism" value={tinai.symbolism} />
            <MetaRow label="Deity" value={tinai.deity} />
            <MetaRow label="Climate" value={tinai.climate} />
            <MetaRow label="Flora" value={tinai.flora} />
            <MetaRow label="Fauna" value={tinai.fauna} />
            <MetaRow label="Occupation" value={tinai.occupation} />
            <MetaRow label="Traditions" value={tinai.traditions} />
            <MetaRow label="Cuisine" value={tinai.cuisine} />
            <MetaRow label="Music (Pann)" value={tinai.music} />
          </dl>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
TinaiContentPanel.displayName = "TinaiContentPanel";

const TinaiShowcaseSection: React.FC = () => {
  const [activeId, setActiveId] = useState<TinaiId>(defaultTinaiId);

  const activeTinai = useMemo(
    () => tinaiData.find((t) => t.id === activeId) ?? tinaiData[0],
    [activeId]
  );

  const handleSelect = useCallback((id: TinaiId) => {
    setActiveId(id);
  }, []);

  return (
    <section
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Sangam Tinai Showcase"
    >
      <header className="mb-2 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          The Five Tinai Landscapes
        </h2>
        <p className="mt-2 text-sm text-slate-400 sm:text-base">
          Explore the five poetic landscapes of Sangam literature — each with its own
          terrain, mood, and way of life.
        </p>
      </header>

      <TinaiVideoHero activeTinai={activeTinai} />

      <div
        role="tablist"
        aria-label="Select a Tinai landscape"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {tinaiData.map((tinai) => (
          <TinaiCard
            key={tinai.id}
            tinai={tinai}
            isActive={tinai.id === activeId}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <TinaiContentPanel tinai={activeTinai} />
    </section>
  );
};

export default React.memo(TinaiShowcaseSection);
