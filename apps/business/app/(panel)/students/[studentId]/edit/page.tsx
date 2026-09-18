import { StudentFormScreen } from "@/modules/operations/screens/StudentFormScreen";
export default async function Page({ params, searchParams }: { params: Promise<{ studentId: string }>; searchParams: Promise<{ clubId?: string }> }) {
  const { studentId } = await params; const { clubId } = await searchParams;
  return <StudentFormScreen studentId={studentId} requestedClubId={clubId} />;
}
