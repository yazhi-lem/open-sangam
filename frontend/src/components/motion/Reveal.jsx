import { createElement, useEffect, useRef, useState } from "react";

/**
 * Dependency-free scroll-reveal primitives (no framer-motion).
 *
 * Reveal
 * Fades + slides + slightly scales an element into view the first time it
 * crosses the viewport, via IntersectionObserver + CSS transitions. Respects
 * prefers-reduced-motion by cross-fading only (no transform).
 *
 * Usage:
 *   <Reveal><HeroSection /></Reveal>
 *   <Reveal delay={0.1} y={32}><FeatureCard /></Reveal>
 *   <Reveal as="li" y={16} scale={0.98}>...</Reveal>
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // smooth "premium" ease-out

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * useReveal — returns [ref, shown]. `shown` flips true once the element has
 * intersected the viewport by `amount` (0–1 threshold).
 */
function useReveal({ amount = 0.2, once = true } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: Math.min(Math.max(amount, 0), 1) }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, once]);

  return [ref, shown];
}

export default function Reveal({
  children,
  as = "div",
  delay = 0,
  duration = 0.6,
  y = 24,
  scale = 0.97,
  blur = 0, // e.g. blur={8} for a soft focus-pull reveal
  once = true,
  amount = 0.2,
  className = "",
  style,
  ...rest
}) {
  const reduced = prefersReducedMotion();
  const [ref, shown] = useReveal({ amount, once });

  const transform = shown
    ? "translateY(0) scale(1)"
    : `translateY(${y}px) scale(${scale})`;

  const revealStyle = reduced
    ? {
        opacity: shown ? 1 : 0,
        transition: `opacity 0.25s ${EASE}`,
        willChange: "opacity",
        ...style,
      }
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : transform,
        filter: blur ? (shown ? "blur(0px)" : `blur(${blur}px)`) : undefined,
        transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s, filter ${duration}s ${EASE} ${delay}s`,
        willChange: "opacity, transform",
        ...style,
      };

  return createElement(
    as,
    { ref, className, style: revealStyle, ...rest },
    children
  );
}

/**
 * RevealGroup
 * Staggers children (e.g. a grid of cards) with the same enter animation as
 * Reveal, without manually setting per-child delays.
 *
 * Usage:
 *   <RevealGroup className="grid grid-cols-3 gap-6">
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *   </RevealGroup>
 */
export function RevealGroup({
  children,
  className = "",
  stagger = 0.08,
  amount = 0.15,
  once = true,
  ...rest
}) {
  const reduced = prefersReducedMotion();
  const [ref, shown] = useReveal({ amount, once });
  const items = Array.isArray(children) ? children : [children];

  return (
    <div ref={ref} className={className} {...rest}>
      {items.map((child, i) => {
        const delay = reduced ? 0 : i * stagger;
        const itemStyle = reduced
          ? {
              opacity: shown ? 1 : 0,
              transition: `opacity 0.25s ${EASE}`,
            }
          : {
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : "translateY(20px) scale(0.97)",
              transition: `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
              willChange: "opacity, transform",
            };
        return (
          <div
            key={(child && child.key) ?? i}
            className="h-full min-w-0"
            style={itemStyle}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
