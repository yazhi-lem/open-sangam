import { useEffect, useRef, useState } from "react";

/**
 * ScrollTilt — gives a block a gentle 3D tilt driven by its position in the
 * viewport as the page scrolls: tipped slightly as it enters/leaves, easing to
 * flat when centred. CSS/rAF only (no motion library); disabled under
 * prefers-reduced-motion.
 *
 * Usage:
 *   <ScrollTilt intensity={10}>…section…</ScrollTilt>
 */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ScrollTilt({
  children,
  intensity = 8,
  className = "",
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [rotate, setRotate] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion() || typeof window === "undefined") return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: -1 (below viewport) → 0 (centred) → 1 (above viewport)
      const center = rect.top + rect.height / 2;
      const progress = (vh / 2 - center) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      // keep it subtle — a fraction of the requested intensity
      setRotate(clamped * (intensity * 0.4));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [intensity]);

  return (
    <div
      style={{ perspective: "1200px", ...style }}
      className={className}
      {...rest}
    >
      <div
        ref={ref}
        style={{
          transform: `rotateX(${rotate}deg)`,
          transformOrigin: "center",
          transition: `transform 0.15s ${EASE}`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
