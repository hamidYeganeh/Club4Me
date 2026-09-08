import { DiscoveryImageHero } from "@modules/discovery/components/DiscoveryImageHero";

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
    <div className="mb-6 mt-4 w-full shrink-0" data-auth-intro>
      {keyboardOpen ? (
        <section className="rounded-3xl bg-surface p-4">
          <h1 id={titleId} className="text-xl font-extrabold">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          ) : null}
        </section>
      ) : (
        <DiscoveryImageHero
          compact
          imageUrl="/auth/club-access-iran-v2.png"
          imageClassName="object-contain object-top"
          title={title}
          description={subtitle}
          titleId={titleId}
          eyebrow="حساب جیم‌فورمی"
        />
      )}
    </div>
  );
}
