import { AuthGate } from "@/components/auth-gate";
import { RoleRequestScreen } from "@modules/account/screens/RoleRequestScreens";
export default function Page() {
  return (
    <AuthGate>
      <RoleRequestScreen role="coach" />
    </AuthGate>
  );
}
