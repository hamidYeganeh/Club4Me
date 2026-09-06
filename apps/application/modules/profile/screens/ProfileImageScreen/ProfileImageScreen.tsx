"use client";

import { useAccountMe, useUpdateAccountMe } from "@api/account";
import { useCreateMedia } from "@api";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { ProfileImageHeroSection } from "@modules/profile/sections/ProfileImageHeroSection";
import { toast } from "@heroui/react";
import { useTranslations } from "next-intl";

import { PROFILE_AVATAR_SRC } from "../../profile.constants";
import type { ProfileImageScreenProps } from "./ProfileImageScreen.types";

export function ProfileImageScreen({ role }: ProfileImageScreenProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const me = useAccountMe();
  const updateProfile = useUpdateAccountMe();
  const createMedia = useCreateMedia();
  const avatarSrc =
    updateProfile.data?.avatarUrl ?? me.data?.avatarUrl ?? PROFILE_AVATAR_SRC;

  return (
    <main className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent px-5">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile`}
      />
      <ProfileImageHeroSection
        title={t("imageTitle")}
        avatarAlt={t("avatarAlt", { name: t("fallbackName") })}
        avatarSrc={avatarSrc}
        isUploading={updateProfile.isPending || createMedia.isPending}
        onFile={async (file) => {
          try {
            const media = await createMedia.mutateAsync(file);
            await updateProfile.mutateAsync({ avatarUrl: media.url });
            toast.success(t("imageUploadSuccess"));
          } catch {
            toast.danger(t("imageUploadError"));
          }
        }}
      />
    </main>
  );
}
