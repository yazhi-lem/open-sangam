/**
 * src/components/TinaiShowcase/TinaiVideoHero.tsx
 *
 * Renders exactly one <video> element at a time, crossfading smoothly
 * between Tinai landscape videos using Framer Motion. Optimized to avoid
 * flicker/layout shift by keeping the container's box fixed and only
 * animating GPU-friendly `opacity` on the video layer.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TinaiData } from "../../data/tinaiData";

interface TinaiVideoHeroProps {
  activeTinai: TinaiData;
}

/**
 * Internal layer responsible for actually playing a single Tinai's video.
 * Memoized so that only the layer whose `src` changes re-renders/re-mounts.
 */
const VideoLayer = React.memo(function VideoLayer({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    // Ensure playback starts/resumes even if autoplay is throttled by the
    // browser after a source swap.
    const playPromise = node.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /* Autoplay was blocked; silently ignore since video is muted. */
      });
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      key={src}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
});

const TinaiVideoHero: React.FC<TinaiVideoHeroProps> = ({ activeTinai }) => {
  const prefersReducedMotion = useReducedMotion();

  // Track the currently displayed source separately from `activeTinai` so
  // we can control the exact fade-out -> swap -> fade-in sequence.
  const [displayedSrc, setDisplayedSrc] = useState(activeTinai.videoSrc);
  const [displayedLabel, setDisplayedLabel] = useState(activeTinai.name);

  useEffect(() => {
    setDisplayedSrc(activeTinai.videoSrc);
    setDisplayedLabel(activeTinai.name);
  }, [activeTinai.videoSrc, activeTinai.name]);

  const transitionDuration = useMemo(
    () => (prefersReducedMotion ? 0.25 : 0.7),
    [prefersReducedMotion]
  );

  const handleExitComplete = useCallback(() => {
    /* No-op placeholder retained for clarity / future analytics hooks. */
  }, []);

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-2xl",
        "border border-white/20",
        "bg-black/40 backdrop-blur-md",
        "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        "h-[280px] sm:h-[420px] lg:h-[600px]",
        "aspect-video",
      ].join(" ")}
      role="tabpanel"
      id={`tinai-panel-${activeTinai.id}`}
      aria-labelledby={`tinai-tab-${activeTinai.id}`}
    >
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        <motion.div
          key={displayedSrc}
          className="absolute inset-0 h-full w-full will-change-[opacity]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration, ease: "easeInOut" }}
        >
          <VideoLayer src={displayedSrc} label={`${displayedLabel} landscape video`} />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic gradient overlay, sits above the video, below any future controls */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"
        aria-hidden="true"
      />
    </div>
  );
};

export default React.memo(TinaiVideoHero);
