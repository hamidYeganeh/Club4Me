import { StudentFormScreen } from "@/modules/operations/screens/StudentFormScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <StudentFormScreen requestedClubId={clubId} />;
}
