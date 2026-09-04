import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen";

type Props = { params: Promise<{ locationId: string }> };

export function generateStaticParams() {
  return [{ locationId: "demo" }];
}

export default async function EditAthleteLocationPage({ params }: Props) {
  const { locationId } = await params;
  return <LocationFormScreen role="athlete" locationId={locationId} />;
}
