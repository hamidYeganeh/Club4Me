import { Card } from "@heroui/react";
import { FallbackImage } from "@/components/FallbackImage";

export type CoachTrainingStyle = {
  title: string;
  description: string;
  imageUrl?: string | null;
};

export function CoachTrainingStylesSection({ items }: { items: CoachTrainingStyle[] }) {
  if (!items.length) return null;
  return (
    <section className="app-reveal">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-foreground">سبک تمرین</h2>
        <span className="text-xs font-bold text-accent">متناسب با هدف شما</span>
      </div>
      <Card className="app-card overflow-hidden px-5 shadow-none">
        <div className="divide-y divide-white/7">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex items-center gap-4 py-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-[1.25rem] border border-white/8 bg-surface-secondary">
                <FallbackImage src={item.imageUrl} alt={item.title} fill unoptimized sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-foreground">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
