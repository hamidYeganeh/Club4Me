import type { ClubProfile } from "./dto/club-profile.dto";

export function profileReferences(
  profile?: ClubProfile,
): Array<{ category: string; resource: string; id: string }> {
  const references: Array<{ category: string; resource: string; id: string }> =
    [];
  const add = (resource: string, id?: string, category = "facilities") => {
    if (id) references.push({ category, resource, id });
  };
  for (const space of profile?.spaces ?? []) {
    add("court-surface-type", space.floorTypeId);
    add("roof-type", space.roofTypeId);
    add("lighting-type", space.lightingTypeId);
    add("water-treatment-type", space.waterTreatmentTypeId);
  }
  add("ventilation-type", profile?.ventilationTypeId);
  add("cooling-type", profile?.coolingTypeId);
  add("parking-type", profile?.parkingTypeId);
  add("accessibility-type", profile?.accessibilityTypeId);
  for (const id of profile?.firstVisit?.requiredItemIds ?? [])
    add("required-item-type", id, "classes");
  return references;
}

// Existing free-text values remain readable; owners cannot create new catalog
// values via legacy fields. Selecting an ID replaces the corresponding text.
export function legacyProfileValues(profile?: ClubProfile): string[] {
  return [
    ...(profile?.spaces ?? []).flatMap((space) =>
      Object.entries({
        floorType: space.floorType,
        roofType: space.roofType,
        lighting: space.lighting,
        waterTreatment: space.waterTreatment,
      }),
    ),
    ...Object.entries({
      ventilation: profile?.ventilation,
      cooling: profile?.cooling,
      parking: profile?.parking,
      wheelchairAccess: profile?.wheelchairAccess,
    }),
    ...(profile?.firstVisit?.requiredItems ?? []).map((item) => [
      "requiredItem",
      item,
    ]),
  ]
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([key, value]) => `${key}:${value}`);
}
