import { useEffect, useMemo, useState } from "react";
import {
  computeBestSixBreakdown,
  rowsToRequirementGrades,
  PREDICTOR_BEST_SIX_STORAGE_KEY,
  PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY,
} from "../lib/admissions.js";
import { BGCSE_SUBJECTS } from "../lib/bgcseSubjects.js";

function newRow() {
  const key =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { key, subjectId: "", grade: "" };
}

/**
 * Shared BGCSE row state, validation, best-six breakdown, requirement grades, and session sync
 * (same keys as the Admission predictor page).
 */
export function usePredictorGradeInput() {
  const [rows, setRows] = useState(() => [newRow()]);

  const chosenSubjectIds = useMemo(
    () => new Set(rows.map((r) => r.subjectId).filter(Boolean)),
    [rows],
  );

  const validationMessage = useMemo(() => {
    const hasSelection = rows.some((r) => r.subjectId && r.grade?.trim());
    if (!hasSelection) return "Add at least one subject and choose a grade.";
    for (const r of rows) {
      if (!r.subjectId && !r.grade?.trim()) continue;
      if (r.subjectId && !r.grade?.trim()) return "Choose a grade for each selected subject.";
      if (!r.subjectId && r.grade?.trim()) return "Choose a subject for each grade entered.";
    }
    return null;
  }, [rows]);

  const breakdown = useMemo(() => {
    if (validationMessage) return null;
    const gradeRows = rows.filter((r) => r.subjectId && r.grade?.trim()).map((r) => ({
      subjectId: r.subjectId,
      grade: r.grade,
    }));
    return computeBestSixBreakdown(gradeRows);
  }, [rows, validationMessage]);

  const requirementGrades = useMemo(() => {
    if (!breakdown || breakdown.invalid) return null;
    const gradeRows = rows
      .filter((r) => r.subjectId && r.grade?.trim())
      .map((r) => ({ subjectId: r.subjectId, grade: r.grade }));
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
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= 9 ? prev : [...prev, newRow()]));
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
    canAdd: rows.length < 9,
    /** All BGCSE subjects for select options */
    bgcseSubjects: BGCSE_SUBJECTS,
  };
}
