import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen";

type Props = { params: Promise<{ locationId: string }> };

export default async function EditCoachLocationPage({ params }: Props) {
  const { locationId } = await params;
  return <LocationFormScreen role="coach" locationId={locationId} />;
}
