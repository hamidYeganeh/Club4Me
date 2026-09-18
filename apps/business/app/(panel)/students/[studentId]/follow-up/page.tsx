import { FollowUpFormScreen } from "@/modules/operations/screens/FollowUpFormScreen";
export default async function Page({ params, searchParams }: { params: Promise<{ studentId: string }>; searchParams: Promise<{ clubId: string }> }) {
  const { studentId } = await params; const { clubId } = await searchParams;
  return <FollowUpFormScreen studentId={studentId} clubId={clubId} />;
}
