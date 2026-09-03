import { AccountAuthLoginScreen } from "@modules/account/screens/AccountAuthLoginScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود | پنل باشگاه کلاب فور می",
};

export default function AuthLoginPage() {
  return <AccountAuthLoginScreen />;
}
