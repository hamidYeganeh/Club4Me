import { AccountAuthSetPasswordScreen } from "@modules/account/screens/AccountAuthSetPasswordScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تنظیم رمز عبور | جیم فور می",
};

export default function AuthSetPasswordPage() {
  return <AccountAuthSetPasswordScreen />;
}
