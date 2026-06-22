function ProfileSection({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-brand-900">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default ProfileSection;
