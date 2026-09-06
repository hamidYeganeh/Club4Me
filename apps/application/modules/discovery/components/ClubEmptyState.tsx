import Image from "next/image";

export function ClubEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="app-surface flex min-h-52 flex-col items-center justify-center rounded-3xl px-5 py-6 text-center">
      <Image
        src="/discovery/no-slots.png"
        alt=""
        width={192}
        height={128}
        className="h-28 w-auto object-cover opacity-90 drop-shadow-lg"
      />
      <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 max-w-[36ch] text-xs leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}
