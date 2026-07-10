import { motion, useReducedMotion } from "framer-motion";

/**
 * Reveal
 * Fades + slides + slightly scales a section/card/image into view once,
 * the first time it crosses the viewport. Respects prefers-reduced-motion
 * by disabling the transform and only cross-fading instead.
 *
 * Usage:
 *   <Reveal><HeroSection /></Reveal>
 *   <Reveal delay={0.1} y={32}><FeatureCard /></Reveal>
 *   <Reveal as="li" y={16} scale={0.98}>...</Reveal>
 */
export default function Reveal({
  children,
  as = "div",
  delay = 0,
  duration = 0.6,
  y = 24,
  scale = 0.97,
  blur = 0, // e.g. blur={8} for a soft focus-pull reveal
  once = true,
  amount = 0.2, // fraction of element that must be visible to trigger
  className = "",
  ...rest
}) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] ?? motion.div;

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y, scale, filter: blur ? `blur(${blur}px)` : undefined };

  const shown = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1, filter: blur ? "blur(0px)" : undefined };

  return (
    <MotionTag
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={{ once, amount }}
      transition={{
        duration: prefersReducedMotion ? 0.25 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1], // smooth "premium" ease-out
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * RevealGroup
 * Staggers children (e.g. a grid of feature cards) using the same
 * enter animation as Reveal, without manually setting delays.
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
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : stagger,
      },
    },
  };

  const item = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={container}
      {...rest}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={child.key ?? i} className="h-full min-w-0" variants={item}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
