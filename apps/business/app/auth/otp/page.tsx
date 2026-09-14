import { AccountAuthOtpScreen } from "@modules/account/screens/AccountAuthOtpScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود با پیامک | پنل باشگاه کلاب‌فورمی",
};

export default function AuthOtpPage() {
  return <AccountAuthOtpScreen />;
}
