import { WelcomeIntroduceScreen } from "@modules/welcome/screens/WelcomeIntroduceScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "معرفی | جیم فور می",
};

export default function WelcomeIntroducePage() {
  return <WelcomeIntroduceScreen />;
}
