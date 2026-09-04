import { AccountAuthLoginScreen } from "@modules/account/screens/AccountAuthLoginScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود | جیم فور می",
};

export default function AuthLoginPage() {
  return <AccountAuthLoginScreen />;
}
