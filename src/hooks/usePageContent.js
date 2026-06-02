import { useEffect, useState } from "react";
import { fetchPageContent, mergePageSections } from "../lib/contentManagement.js";

export function usePageContent(pageKey, defaults) {
  const [content, setContent] = useState(defaults);
  const [source, setSource] = useState("default");

  useEffect(() => {
    let cancelled = false;
    setContent(defaults);
    setSource("default");
    fetchPageContent(pageKey)
      .then((rows) => {
        if (cancelled) return;
        if (!rows.length) {
          setContent(defaults);
          setSource("default");
          return;
        }
        setContent(mergePageSections(defaults, rows));
        setSource("live");
      })
      .catch(() => {
        if (!cancelled) {
          setContent(defaults);
          setSource("default");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pageKey, defaults]);

  return { content, source };
}
