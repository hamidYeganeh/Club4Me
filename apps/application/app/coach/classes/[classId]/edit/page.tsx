import { CoachClassFormScreen } from "@modules/coach/screens/CoachClassFormScreen";
export default async function EditCoachClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <CoachClassFormScreen classId={classId} />;
}
