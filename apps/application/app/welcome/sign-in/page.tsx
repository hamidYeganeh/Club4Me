import { redirect } from "next/navigation";

export default function WelcomeSignInPage() {
  redirect("/auth");
}
