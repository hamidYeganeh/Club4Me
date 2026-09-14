import { AccountAuthSetPasswordScreen } from "@modules/account/screens/AccountAuthSetPasswordScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تنظیم رمز عبور | کلاب‌فورمی",
};

export default function AuthSetPasswordPage() {
  return <AccountAuthSetPasswordScreen />;
}
