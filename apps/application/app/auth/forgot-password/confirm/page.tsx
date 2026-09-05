import { Suspense } from "react";
import { AccountAuthForgotPasswordConfirmScreen } from "@modules/account/screens/AccountAuthForgotPasswordConfirmScreen";
import type { Metadata } from "next";
import { AuthScreenSkeleton } from "@/components/loading-skeletons";

export const metadata: Metadata = {
  title: "تأیید بازیابی رمز عبور | جیم فور می",
};

export default function AuthForgotPasswordConfirmPage() {
  return (
    <Suspense fallback={<AuthScreenSkeleton />}>
      <AccountAuthForgotPasswordConfirmScreen />
    </Suspense>
  );
}
