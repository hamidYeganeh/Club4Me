import { Suspense } from "react";
import { AccountAuthOtpConfirmScreen } from "@modules/account/screens/AccountAuthOtpConfirmScreen";
import type { Metadata } from "next";
import { AuthScreenSkeleton } from "@/components/loading-skeletons";

export const metadata: Metadata = {
  title: "تأیید کد | جیم فور می",
};

export default function AuthOtpConfirmPage() {
  return (
    <Suspense fallback={<AuthScreenSkeleton />}>
      <AccountAuthOtpConfirmScreen />
    </Suspense>
  );
}
