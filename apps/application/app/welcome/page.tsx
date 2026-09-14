import { WelcomeHomeScreen } from "@modules/welcome/screens/WelcomeHomeScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خوش آمدید | کلاب‌فورمی",
};

export default function WelcomePage() {
  return <WelcomeHomeScreen />;
}
