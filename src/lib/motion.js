export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollElementIntoView(element, options = {}) {
  if (!element) return;
  element.scrollIntoView({
    ...options,
    behavior: prefersReducedMotion() ? "auto" : options.behavior || "smooth",
  });
}
