import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return (
    <SupportTicketsScreen role="coach" view="detail" ticketId={ticketId} />
  );
}
