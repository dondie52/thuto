/**
 * @param {{ steps: Array<{ id: string, label: string }>, currentStep: string, completedSteps: Set<string> }} props
 */
export default function OnboardingStepIndicator({ steps, currentStep, completedSteps }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs font-medium text-slate-600" aria-label="Onboarding steps">
      {steps.map((step, index) => {
        const active = currentStep === step.id;
        const done = completedSteps.has(step.id);
        return (
          <li
            key={step.id}
            className={[
              "rounded-full px-3 py-1",
              active && "bg-brand-700 text-white",
              !active && done && "bg-emerald-100 text-emerald-900",
              !active && !done && "bg-brand-100 text-brand-800",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {index + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
