import { Suspense } from "react";
import { AccountAuthOtpConfirmScreen } from "@modules/account/screens/AccountAuthOtpConfirmScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید کد | پنل باشگاه کلاب فور می",
};

export default function AuthOtpConfirmPage() {
  return (
    <Suspense>
      <AccountAuthOtpConfirmScreen />
    </Suspense>
  );
}
