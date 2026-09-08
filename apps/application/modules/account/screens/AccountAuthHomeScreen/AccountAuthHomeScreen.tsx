"use client";
import { AccountAuthHomeActionsSection } from "@modules/account/sections/AccountAuthHomeActionsSection";
import { DiscoveryImageHero } from "@modules/discovery/components/DiscoveryImageHero";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { useTranslations } from "next-intl";

export function AccountAuthHomeScreen() {
  const t = useTranslations("auth.home");
  const common = useTranslations("common");
  return <main className="app-page gap-5">
    <SecondaryHeader title="ورود به حساب" showFilter={false} backHref="/welcome" />
    <DiscoveryImageHero imageUrl="/profile/cover.jpg" title={common("appName")} description={t("tagline")} eyebrow="شروع مسیر ورزشی شما" compact />
    <section className="app-card space-y-5 p-5">
      <div><h2 className="text-lg font-extrabold">خوش آمدید</h2><p className="mt-2 text-sm leading-7 text-muted">روش ورود به حساب خود را انتخاب کنید.</p></div>
      <AccountAuthHomeActionsSection otpLabel={t("loginWithOtp")} passwordLabel={t("loginWithPassword")} />
    </section>
  </main>;
}
