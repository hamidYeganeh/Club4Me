/** Keep the form within reach when the native keyboard occupies the viewport. */
export function AuthPageIntro({
  title,
  subtitle,
  titleId,
  keyboardOpen = false,
}: {
  title: string;
  subtitle?: string;
  titleId?: string;
  keyboardOpen?: boolean;
}) {
  return (
    <div
      className={`w-full shrink-0 text-start ${keyboardOpen ? "mb-4" : "mb-6"}`}
      data-auth-intro
    >
      <h1 id={titleId} className="text-2xl leading-9 font-extrabold">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-7 text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
