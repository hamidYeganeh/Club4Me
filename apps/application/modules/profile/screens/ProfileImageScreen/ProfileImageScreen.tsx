"use client";

import { useEffect, useState } from "react";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { ProfileImageHeroSection } from "@modules/profile/sections/ProfileImageHeroSection";
import { useTranslations } from "next-intl";

import { PROFILE_AVATAR_SRC } from "../../profile.constants";
import type { ProfileImageScreenProps } from "./ProfileImageScreen.types";

export function ProfileImageScreen({ role }: ProfileImageScreenProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [previewSrc, setPreviewSrc] = useState<string | null>(PROFILE_AVATAR_SRC);

  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile`}
      />
      <ProfileImageHeroSection
        title={t("imageTitle")}
        avatarAlt={t("avatarAlt", { name: t("fallbackName") })}
        avatarSrc={previewSrc}
        fallback={t("fallbackName")}
        uploadLabel={t("upload")}
        onUpload={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          const nextSrc = URL.createObjectURL(file);
          setPreviewSrc((current) => {
            if (current?.startsWith("blob:")) {
              URL.revokeObjectURL(current);
            }
            return nextSrc;
          });
        }}
      />
    </main>
  );
}
