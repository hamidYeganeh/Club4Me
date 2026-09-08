import { AuthGate } from "@/components/auth-gate";
import { RoleRequestsScreen } from "@modules/account/screens/RoleRequestScreens";
export default function Page() {
  return (
    <AuthGate>
      <RoleRequestsScreen />
    </AuthGate>
  );
}
