import { useState } from "react";

/**
 * AnimatedCard — an interactive card with a subtle hover-lift and tap-press,
 * using CSS transitions only (no motion library). Forwards onClick/className
 * and is keyboard-operable, since it stands in for a clickable link.
 *
 * Usage:
 *   <AnimatedCard onClick={...} className="rounded-xl border p-5">…</AnimatedCard>
 */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function AnimatedCard({
  children,
  onClick,
  className = "",
  as = "div",
  style,
  ...rest
}) {
  const reduced = prefersReducedMotion();
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const transform = reduced
    ? undefined
    : active
      ? "translateY(-2px) scale(0.985)"
      : hover
        ? "translateY(-4px) scale(1.01)"
        : "translateY(0) scale(1)";

  const cardStyle = {
    transform,
    transition: reduced ? undefined : `transform 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
    cursor: onClick ? "pointer" : undefined,
    willChange: reduced ? undefined : "transform",
    ...style,
  };

  function handleKeyDown(e) {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  }

  const Tag = as;

  return (
    <Tag
      className={className}
      style={cardStyle}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
