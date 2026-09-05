"use client";
import { NextIntlClientProvider } from "next-intl";
import { MotionConfig } from "@ui/landing-motion";
import { HomeScreen } from "@modules/marketing/screens/HomeScreen";
import messages from "@modules/marketing/lib/messages.json";
export function LandingHomeScreen() {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale="fa"
      timeZone="Asia/Tehran"
    >
      <MotionConfig reducedMotion="user">
        <HomeScreen />
      </MotionConfig>
    </NextIntlClientProvider>
  );
}
