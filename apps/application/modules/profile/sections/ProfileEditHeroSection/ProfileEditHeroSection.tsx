"use client";
import Link from "@/components/app-link";
import { useAccountMe } from "@api/account";
import { Avatar } from "@heroui/react";
import { useTranslations } from "next-intl";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryImageHero } from "@modules/discovery/components/DiscoveryImageHero";
import { getProfileDisplayName } from "../../profile.utils";
import type { ProfileEditHeroSectionProps } from "./ProfileEditHeroSection.types";
export function ProfileEditHeroSection({ role }: ProfileEditHeroSectionProps) {
  const t = useTranslations("profile");
  const me = useAccountMe();
  const name = getProfileDisplayName(me.data, t("fallbackName"));
  return (
    <>
      <SecondaryHeader
        title="ویرایش پروفایل"
        showFilter={false}
        backHref={`/${role}/profile`}
      />
      <div className="mx-4 mt-4 shrink-0">
        <DiscoveryImageHero
          compact
          imageUrl="/profile/cover.jpg"
          title={t("editHeadline")}
          description="اطلاعاتت را به‌روز نگه دار تا تجربهٔ مناسب‌تری داشته باشی."
        >
          <Link
            href={`/${role}/profile/image`}
            aria-label={t("changeImage")}
            className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/30 bg-black/30 p-2 text-white"
          >
            <Avatar className="size-12">
              <Avatar.Image src={me.data?.avatarUrl ?? undefined} alt={name} />
              <Avatar.Fallback className="bg-accent text-accent-foreground">
                {name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join(" ")}
              </Avatar.Fallback>
            </Avatar>
            <span className="pe-2 text-sm font-bold">{t("changeImage")}</span>
          </Link>
        </DiscoveryImageHero>
      </div>
    </>
  );
}
