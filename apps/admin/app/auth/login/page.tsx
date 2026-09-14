import { AccountAuthLoginScreen } from "@modules/account/screens/AccountAuthLoginScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود | پنل مدیریت کلاب‌فورمی",
};

export default function AuthLoginPage() {
  return <AccountAuthLoginScreen />;
}
