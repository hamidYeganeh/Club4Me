import { PaymentFormScreen } from "@/modules/operations/screens/PaymentFormScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <PaymentFormScreen requestedClubId={clubId} mode="payout" />;
}
