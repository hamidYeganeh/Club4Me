"use client";

export function FormSectionNavigation({ sections }: { sections: readonly { id: string; title: string }[] }) {
  return <nav aria-label="بخش‌های فرم" className="form-section-navigation">
    {sections.map((section, index) => <a key={section.id} href={`#${section.id}`}>
      <span aria-hidden>{(index + 1).toLocaleString("fa-IR")}</span>{section.title}
    </a>)}
  </nav>;
}

export function FormSectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div id={id} tabIndex={-1} className="form-section-heading">
    <h2>{title}</h2><p>{description}</p>
  </div>;
}
