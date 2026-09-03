import { notFound } from "next/navigation";
import { ProfileEditFieldScreen } from "@modules/profile/screens/ProfileEditFieldScreen";
import {
  getProfileEditFieldParams,
  isProfileEditField,
} from "@modules/profile/profile.utils";

type PageProps = {
  params: Promise<{ field: string }>;
};

export function generateStaticParams() {
  return getProfileEditFieldParams();
}

export default async function CoachProfileEditFieldPage({ params }: PageProps) {
  const { field } = await params;

  if (!isProfileEditField(field)) {
    notFound();
  }

  return <ProfileEditFieldScreen role="coach" field={field} />;
}
