function ProfileSection({ id, title, description, icon, hideDescription = false, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-stone-200/70 py-4 sm:py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? <span className="shrink-0 text-brand-700">{icon}</span> : null}
            <h2 className="font-display text-lg font-semibold text-brand-900 sm:text-xl">{title}</h2>
          </div>
          {description && !hideDescription ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default ProfileSection;
