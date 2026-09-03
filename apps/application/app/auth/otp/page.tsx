import { AccountAuthOtpScreen } from "@modules/account/screens/AccountAuthOtpScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود با پیامک | کلاب فور می",
};

export default function AuthOtpPage() {
  return <AccountAuthOtpScreen />;
}
