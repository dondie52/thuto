import { useEffect, useId, useMemo, useRef, useState } from "react";

const DEFAULT_CHAR_LIMIT = 650;

/**
 * Collapses long copy with either a line clamp (feed-style) or character limit.
 *
 * @param {{
 *   text: string,
 *   limit?: number,
 *   maxLines?: number,
 *   className?: string,
 *   buttonClassName?: string,
 *   preserveWrap?: boolean,
 *   renderText?: (text: string) => import("react").ReactNode,
 *   moreLabel?: string,
 *   lessLabel?: string,
 * }} props
 */
export default function ExpandableText({
  text,
  limit = DEFAULT_CHAR_LIMIT,
  maxLines = 0,
  className = "",
  buttonClassName = "",
  preserveWrap = false,
  renderText,
  moreLabel = "See more",
  lessLabel = "See less",
}) {
  const [expanded, setExpanded] = useState(false);
  const [isLineTruncated, setIsLineTruncated] = useState(false);
  const contentRef = useRef(null);
  const contentId = useId();
  const cleanText = String(text || "");
  const useLineClamp = Number(maxLines) > 0;
  const shouldCollapseByChars = !useLineClamp && cleanText.length > limit;

  const preview = useMemo(() => {
    if (!shouldCollapseByChars || expanded) return cleanText;
    const clipped = cleanText.slice(0, limit).replace(/\s+\S*$/, "").trimEnd();
    return clipped || cleanText.slice(0, limit).trimEnd();
  }, [cleanText, expanded, limit, shouldCollapseByChars]);

  useEffect(() => {
    setExpanded(false);
  }, [cleanText]);

  useEffect(() => {
    if (!useLineClamp || expanded) return undefined;
    const element = contentRef.current;
    if (!element) return undefined;

    const measure = () => {
      setIsLineTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cleanText, expanded, maxLines, useLineClamp]);

  if (!cleanText) return null;

  const showToggle = useLineClamp ? isLineTruncated || expanded : shouldCollapseByChars;
  const displayText = shouldCollapseByChars && !expanded ? preview : cleanText;
  const lineClampStyle =
    useLineClamp && !expanded
      ? {
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : undefined;

  return (
    <div>
      <p
        id={contentId}
        ref={useLineClamp ? contentRef : undefined}
        className={[
          preserveWrap ? "whitespace-pre-wrap" : "whitespace-pre-line",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={lineClampStyle}
      >
        {renderText ? renderText(displayText) : displayText}
        {shouldCollapseByChars && !expanded ? "…" : ""}
      </p>
      {showToggle ? (
        <button
          type="button"
          className={[
            "focus-ring mt-1 inline-flex min-h-9 items-center rounded-lg text-sm font-semibold text-stone-500 hover:text-brand-800",
            buttonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  );
}
