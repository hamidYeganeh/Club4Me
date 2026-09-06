import Image from "next/image";

export function ReviewEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="app-surface flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] px-6 py-8 text-center">
      <Image
        src="/discovery/reviews-empty.png"
        alt=""
        width={750}
        height={516}
        className="h-auto w-52 max-w-[72%] object-contain drop-shadow-xl"
      />
      <p className="mt-4 font-black text-foreground">{title}</p>
      <p className="mt-2 max-w-[34ch] text-sm leading-7 text-muted">
        {description}
      </p>
    </div>
  );
}
