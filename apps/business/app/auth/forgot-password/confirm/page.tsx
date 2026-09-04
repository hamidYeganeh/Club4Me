import { Suspense } from "react";
import { AccountAuthForgotPasswordConfirmScreen } from "@modules/account/screens/AccountAuthForgotPasswordConfirmScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید بازیابی رمز عبور | پنل باشگاه جیم فور می",
};

export default function AuthForgotPasswordConfirmPage() {
  return (
    <Suspense>
      <AccountAuthForgotPasswordConfirmScreen />
    </Suspense>
  );
}
