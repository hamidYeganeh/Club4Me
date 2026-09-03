import { AccountAuthRolesScreen } from "@modules/account/screens/AccountAuthRolesScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "انتخاب نقش | کلاب فور می",
};

export default function AuthRolesPage() {
  return <AccountAuthRolesScreen />;
}
