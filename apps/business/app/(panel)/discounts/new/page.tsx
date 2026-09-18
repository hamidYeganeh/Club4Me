import { DiscountFormScreen } from "@/modules/discounts/DiscountFormScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <DiscountFormScreen requestedClubId={clubId} />;
}
