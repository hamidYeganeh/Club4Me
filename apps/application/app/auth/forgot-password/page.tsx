import { AccountAuthForgotPasswordScreen } from "@modules/account/screens/AccountAuthForgotPasswordScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "فراموشی رمز عبور | کلاب‌فورمی",
};

export default function AuthForgotPasswordPage() {
  return <AccountAuthForgotPasswordScreen />;
}
