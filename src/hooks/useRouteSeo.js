import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { absoluteSiteUrl, upsertHeadElement } from "../lib/seo.js";

export function useRouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const url = absoluteSiteUrl(location.pathname);

    upsertHeadElement(
      'link[rel="canonical"]',
      () => {
        const element = document.createElement("link");
        element.setAttribute("rel", "canonical");
        return element;
      },
      (element) => {
        element.setAttribute("href", url);
      },
    );

    upsertHeadElement(
      'meta[property="og:url"]',
      () => {
        const element = document.createElement("meta");
        element.setAttribute("property", "og:url");
        return element;
      },
      (element) => {
        element.setAttribute("content", url);
      },
    );
  }, [location.pathname]);
}
