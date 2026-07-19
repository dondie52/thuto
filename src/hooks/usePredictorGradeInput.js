import { useEffect, useMemo, useState } from "react";
import {
  computeBestSixBreakdown,
  rowsToRequirementGrades,
  PREDICTOR_BEST_SIX_STORAGE_KEY,
  PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY,
} from "../lib/admissions.js";
import { BGCSE_SUBJECTS, SCIENCE_DOUBLE_SUBJECT_ID } from "../lib/bgcseSubjects.js";
import { getGradingProfile, gradeOptionsForSyllabus } from "../lib/gradingSystems.js";

function newRow() {
  const key =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { key, subjectId: "", grade: "", grade2: "" };
}

function toRow(row = {}) {
  return {
    key:
      row.key ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    subjectId: row.subjectId || "",
    grade: row.grade || "",
    grade2: row.grade2 || "",
  };
}

/**
 * Shared grade-row state for predictor / onboarding / fit finder.
 * @param {{ syllabusType?: string | null }} [options]
 */
export function usePredictorGradeInput(options = {}) {
  const syllabusType = options.syllabusType || "bgcse";
  const profile = getGradingProfile(syllabusType);
  const [rows, setRows] = useState(() => [newRow()]);

  const chosenSubjectIds = useMemo(
    () => new Set(rows.map((r) => r.subjectId).filter(Boolean)),
    [rows],
  );

  const gradeOptions = useMemo(() => gradeOptionsForSyllabus(syllabusType), [syllabusType]);

  const validationMessage = useMemo(() => {
    const hasSelection = rows.some((r) => r.subjectId && (r.grade?.trim() || r.grade2?.trim()));
    if (!hasSelection) return "Add at least one subject and choose a grade.";
    for (const r of rows) {
      if (!r.subjectId && !r.grade?.trim() && !r.grade2?.trim()) continue;
      if (r.subjectId && !r.grade?.trim()) return "Choose a grade for each selected subject.";
      if (!r.subjectId && (r.grade?.trim() || r.grade2?.trim())) {
        return "Choose a subject for each grade entered.";
      }
      if (
        profile.allowsScienceDouble &&
        r.subjectId === SCIENCE_DOUBLE_SUBJECT_ID &&
        r.grade?.trim() &&
        !r.grade2?.trim()
      ) {
        return "Science Double Award needs two component grades (e.g. C and C for CC).";
      }
    }
    return null;
  }, [rows, profile.allowsScienceDouble]);

  const breakdown = useMemo(() => {
    if (validationMessage) return null;
    const gradeRows = rows.filter((r) => r.subjectId && r.grade?.trim()).map((r) => ({
      subjectId: r.subjectId,
      grade: r.grade,
      grade2: r.grade2,
    }));
    return computeBestSixBreakdown(gradeRows, syllabusType);
  }, [rows, validationMessage, syllabusType]);

  const requirementGrades = useMemo(() => {
    if (!breakdown || breakdown.invalid) return null;
    const gradeRows = rows
      .filter((r) => r.subjectId && r.grade?.trim())
      .map((r) => ({ subjectId: r.subjectId, grade: r.grade, grade2: r.grade2 }));
    return rowsToRequirementGrades(gradeRows);
  }, [rows, breakdown]);

  useEffect(() => {
    if (breakdown && !breakdown.invalid && breakdown.counted.length > 0 && requirementGrades) {
      try {
        sessionStorage.setItem(PREDICTOR_BEST_SIX_STORAGE_KEY, String(breakdown.total));
        sessionStorage.setItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY, JSON.stringify(requirementGrades));
      } catch {
        /* ignore */
      }
    }
  }, [breakdown, requirementGrades]);

  function updateRow(rowKey, patch) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const next = { ...r, ...patch };
        if (patch.subjectId != null && patch.subjectId !== SCIENCE_DOUBLE_SUBJECT_ID) {
          next.grade2 = "";
        }
        if (patch.subjectId === SCIENCE_DOUBLE_SUBJECT_ID) {
          next.grade2 = next.grade2 || "";
        }
        return next;
      }),
    );
  }

  function addRow() {
    setRows((prev) => (prev.length >= 12 ? prev : [...prev, newRow()]));
  }

  function removeRow(rowKey) {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== rowKey);
      return next.length ? next : [newRow()];
    });
  }

  function resetRows() {
    setRows([newRow()]);
  }

  function replaceRows(nextRows) {
    const cleaned = Array.isArray(nextRows)
      ? nextRows
          .map((row) => toRow(row))
          .filter((row) => row.subjectId || row.grade)
          .slice(0, 12)
      : [];
    setRows(cleaned.length ? cleaned : [newRow()]);
  }

  return {
    rows,
    setRows,
    chosenSubjectIds,
    validationMessage,
    breakdown,
    requirementGrades,
    updateRow,
    addRow,
    removeRow,
    resetRows,
    replaceRows,
    canAdd: rows.length < 12,
    bgcseSubjects: BGCSE_SUBJECTS,
    gradeOptions,
    gradingProfile: profile,
  };
}
