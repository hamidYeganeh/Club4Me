import { AccountAuthHomeScreen } from "@modules/account/screens/AccountAuthHomeScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود | کلاب فور می",
};

export default function AuthPage() {
  return <AccountAuthHomeScreen />;
}
