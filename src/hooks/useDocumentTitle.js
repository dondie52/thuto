import { useEffect } from "react";

/**
 * Sets `document.title` when `title` changes. No restore on unmount - the next route sets its own title.
 * @param {string} title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
