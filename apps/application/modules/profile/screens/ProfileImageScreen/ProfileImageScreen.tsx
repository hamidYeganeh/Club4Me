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
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    PROFILE_AVATAR_SRC,
  );

  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  return (
    <main className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent px-5">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile`}
      />
      <ProfileImageHeroSection
        title={t("imageTitle")}
        avatarAlt={t("avatarAlt", { name: t("fallbackName") })}
        avatarSrc={previewSrc}
        onFile={(file) => {
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
