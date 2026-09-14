import { Icon } from "@theme/icon";

export function DetailTimeCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <section className="flex aspect-[330/114] min-h-[114px] w-full flex-col justify-between gap-3 rounded-[32px] bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">{title}</h2>
        <Icon name="clock" size={22} className="text-muted" />
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
    </section>
  );
}
