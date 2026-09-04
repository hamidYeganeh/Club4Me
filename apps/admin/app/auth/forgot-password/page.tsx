import { AccountAuthForgotPasswordScreen } from "@modules/account/screens/AccountAuthForgotPasswordScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "فراموشی رمز عبور | پنل مدیریت جیم فور می",
};

export default function AuthForgotPasswordPage() {
  return <AccountAuthForgotPasswordScreen />;
}
