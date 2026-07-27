/**
 * src/components/TinaiShowcase/TinaiCard.tsx
 *
 * A single selectable "tab" card representing one Sangam Tinai landscape.
 * Handles active/inactive visual states, keyboard interaction (Enter/Space),
 * and full ARIA tab semantics for use inside a `role="tablist"` container.
 */

import React, { useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TinaiData } from "../../data/tinaiData";

interface TinaiCardProps {
  tinai: TinaiData;
  isActive: boolean;
  onSelect: (id: TinaiData["id"]) => void;
}

const TinaiCard: React.FC<TinaiCardProps> = ({ tinai, isActive, onSelect }) => {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback(() => {
    onSelect(tinai.id);
  }, [onSelect, tinai.id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        onSelect(tinai.id);
      }
    },
    [onSelect, tinai.id]
  );

  const activeScale = prefersReducedMotion ? 1 : 1.05;

  return (
    <motion.button
      type="button"
      role="tab"
      id={`tinai-tab-${tinai.id}`}
      aria-selected={isActive}
      aria-controls={`tinai-panel-${tinai.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      animate={{ scale: isActive ? activeScale : 1 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.3, ease: "easeOut" }}
      className={[
        "flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-4",
        "text-sm font-medium transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
        isActive
          ? "border-amber-500/80 bg-amber-950/30 text-amber-100 shadow-[0_0_25px_rgba(234,179,8,0.35)]"
          : "border-white/15 bg-slate-900/40 text-slate-300 hover:bg-slate-800/50",
      ].join(" ")}
    >
      <span className="text-base font-semibold tracking-wide">{tinai.name}</span>
      <span className="text-xs opacity-80">{tinai.tamilName}</span>
    </motion.button>
  );
};

export default React.memo(TinaiCard);
