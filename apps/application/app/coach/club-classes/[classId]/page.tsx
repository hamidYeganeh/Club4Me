import { CoachClubClassScreen } from "@modules/coach/screens/CoachClubClassScreen";

type PageProps = { params: Promise<{ classId: string }> };
export function generateStaticParams() { return [{ classId: "class" }]; }
export default async function CoachClubClassPage({ params }: PageProps) {
  const { classId } = await params;
  return <CoachClubClassScreen classId={classId} />;
}
