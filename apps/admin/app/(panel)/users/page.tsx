import { Suspense } from "react";
import { UsersScreen } from "@modules/users/screens/UsersScreen";

export default function UsersPage() {
  return (
    <Suspense fallback={<p role="status">در حال دریافت کاربران…</p>}>
      <UsersScreen />
    </Suspense>
  );
}
