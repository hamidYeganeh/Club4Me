"use client";

import { AccountAuthHomeActionsSection } from "@modules/account/sections/AccountAuthHomeActionsSection";
import { AccountAuthHomeHeroSection } from "@modules/account/sections/AccountAuthHomeHeroSection";
import { AccountAuthLoginBrandSection } from "@modules/account/sections/AccountAuthLoginBrandSection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { useTranslations } from "next-intl";

import { ProgressiveBlur } from "@/components/progressive-blur";

export function AccountAuthHomeScreen() {
  const t = useTranslations("auth.home");
  const tCommon = useTranslations("common");

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <AccountAuthHomeHeroSection alt={t("illustrationAlt")} />

      {/* Bottom gradient + progressive blur overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[65dvh] overflow-hidden">
        <ProgressiveBlur
          direction="bottom"
          className="h-full"
          blurLayers={8}
          blurIntensity={1.25}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-background from-40% via-background/70 to-transparent"
        />
      </div>

      <div className="relative z-20 flex min-h-full flex-1 flex-col px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <AccountAuthOtpHeaderSection
          backLabel={tCommon("back")}
          href="/welcome"
          overlay
        />

        <div className="relative mt-auto w-full">
          <div className="relative z-10 flex w-full flex-col items-center gap-8 pt-16">
            <AccountAuthLoginBrandSection
              name={tCommon("appName")}
              tagline={t("tagline")}
              showIllustration={false}
            />
            <AccountAuthHomeActionsSection
              otpLabel={t("loginWithOtp")}
              passwordLabel={t("loginWithPassword")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
