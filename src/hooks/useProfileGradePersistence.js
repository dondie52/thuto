import { useEffect, useRef, useState } from "react";
import { fetchGradeEntries, saveGradeEntries } from "../lib/onboarding.js";

const LOCAL_GRADE_ROWS_KEY = "thuto_predictor_grade_rows";
const SAVE_DEBOUNCE_MS = 1500;

function readLocalGradeRows() {
  try {
    const raw = localStorage.getItem(LOCAL_GRADE_ROWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && (row.subjectId || row.grade))
      .map((row) => ({
        subjectId: row.subjectId || "",
        grade: row.grade || "",
        grade2: row.grade2 || "",
      }));
  } catch {
    return [];
  }
}

function writeLocalGradeRows(rows) {
  try {
    const cleaned = (rows || [])
      .filter((row) => row.subjectId && row.grade?.trim())
      .map((row) => ({
        subjectId: row.subjectId,
        grade: row.grade,
        grade2: row.grade2 || "",
      }));
    if (!cleaned.length) {
      localStorage.removeItem(LOCAL_GRADE_ROWS_KEY);
      return;
    }
    localStorage.setItem(LOCAL_GRADE_ROWS_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore */
  }
}

function rowsToEntries(rows) {
  return (rows || [])
    .filter((row) => row.subjectId && row.grade?.trim())
    .map((row) => ({
      subjectId: row.subjectId,
      grade: row.grade,
      grade2: row.grade2 || "",
    }));
}

function formHasUserInput(rows) {
  return (rows || []).some((row) => row.subjectId || row.grade?.trim() || row.grade2?.trim());
}

/**
 * Load saved grade rows from profile (signed-in) or localStorage (guest),
 * and persist changes back on a debounced schedule.
 *
 * @param {{
 *   user: { id: string } | null | undefined,
 *   rows: Array<{ subjectId: string, grade: string, grade2?: string }>,
 *   replaceRows: (rows: Array<{ subjectId?: string, grade?: string, grade2?: string }>) => void,
 *   validationMessage: string | null,
 *   breakdown: { invalid: string | null, counted: unknown[] } | null,
 * }} options
 */
export function useProfileGradePersistence({ user, rows, replaceRows, validationMessage, breakdown }) {
  const [gradesNotice, setGradesNotice] = useState("");
  const loadDoneRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (loadDoneRef.current) return;
    let cancelled = false;

    async function loadSavedGrades() {
      if (formHasUserInput(rows)) {
        loadDoneRef.current = true;
        return;
      }

      if (user?.id) {
        try {
          const saved = await fetchGradeEntries();
          if (cancelled) return;
          if (saved.length) {
            skipNextSaveRef.current = true;
            replaceRows(
              saved.map((entry, index) => ({
                key: `saved-${entry.subjectId}-${index}`,
                subjectId: entry.subjectId,
                grade: entry.grade,
                grade2: entry.grade2 || "",
              })),
            );
            setGradesNotice("Loaded your saved grades from your profile.");
          }
        } catch {
          /* optional */
        }
      } else {
        const local = readLocalGradeRows();
        if (local.length) {
          skipNextSaveRef.current = true;
          replaceRows(
            local.map((entry, index) => ({
              key: `local-${entry.subjectId}-${index}`,
              subjectId: entry.subjectId,
              grade: entry.grade,
              grade2: entry.grade2 || "",
            })),
          );
          setGradesNotice("Restored your grades from this device.");
        }
      }

      loadDoneRef.current = true;
    }

    loadSavedGrades();
    return () => {
      cancelled = true;
    };
    // Only run once on mount — rows intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, replaceRows]);

  useEffect(() => {
    if (!loadDoneRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (validationMessage || !breakdown || breakdown.invalid || breakdown.counted.length === 0) return;

    const entries = rowsToEntries(rows);
    if (!entries.length) return;

    const timer = window.setTimeout(() => {
      if (user?.id) {
        saveGradeEntries(entries).catch(() => {});
      } else {
        writeLocalGradeRows(rows);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [rows, user?.id, validationMessage, breakdown]);

  function clearSavedGrades() {
    skipNextSaveRef.current = true;
    setGradesNotice("");
    if (user?.id) {
      saveGradeEntries([]).catch(() => {});
    }
    try {
      localStorage.removeItem(LOCAL_GRADE_ROWS_KEY);
    } catch {
      /* ignore */
    }
  }

  return { gradesNotice, clearSavedGrades };
}
