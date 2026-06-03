import { useId, useMemo, useState } from "react";

const DEFAULT_LIMIT = 650;

/**
 * Collapses long post bodies without hiding media or actions below them.
 *
 * @param {{
 *   text: string,
 *   limit?: number,
 *   className?: string,
 *   buttonClassName?: string,
 *   preserveWrap?: boolean,
 * }} props
 */
export default function ExpandableText({
  text,
  limit = DEFAULT_LIMIT,
  className = "",
  buttonClassName = "",
  preserveWrap = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const cleanText = String(text || "");
  const shouldCollapse = cleanText.length > limit;
  const preview = useMemo(() => {
    if (!shouldCollapse || expanded) return cleanText;
    const clipped = cleanText.slice(0, limit).replace(/\s+\S*$/, "").trimEnd();
    return clipped || cleanText.slice(0, limit).trimEnd();
  }, [cleanText, expanded, limit, shouldCollapse]);

  if (!cleanText) return null;

  return (
    <div>
      <p
        id={contentId}
        className={[
          preserveWrap ? "whitespace-pre-wrap" : "whitespace-pre-line",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {preview}
        {shouldCollapse && !expanded ? "..." : ""}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          className={[
            "focus-ring mt-2 inline-flex min-h-9 items-center rounded-lg text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950",
            buttonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
