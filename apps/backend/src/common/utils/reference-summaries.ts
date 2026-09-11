import { Connection, Types } from "mongoose";

export type ReferenceSummary = {
  field: string;
  as: string;
  collection: string;
  fields: string[];
};
/** Batch only explicitly requested display fields after the caller's access checks. */
export async function withReferenceSummaries<T extends Record<string, unknown>>(
  connection: Connection,
  rows: T[],
  references: ReferenceSummary[],
): Promise<Array<T & Record<string, unknown>>> {
  const targets: Record<string, unknown>[] = [];
  function copy(value: unknown): unknown {
    if (Array.isArray(value)) return Array.from(value, copy);
    if (value && typeof value === "object" && "toObject" in value && typeof value.toObject === "function") return copy(value.toObject({versionKey: false}));
    if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof Types.ObjectId)) {
      const object = Object.fromEntries(Object.entries(value).map(([key, child]) => [key === "_id" ? "id" : key, copy(child)]));
      targets.push(object);
      return object;
    }
    return value;
  }
  const result = rows.map(row => copy(row) as T & Record<string, unknown>);
  await Promise.all(
    references.map(async (reference) => {
      if (
        !targets.some((row) =>
          Object.prototype.hasOwnProperty.call(row, reference.field),
        )
      )
        return;
      const ids = [
        ...new Set(
          targets.flatMap((row) => {
            const value = row[reference.field];
            return (Array.isArray(value) ? value : [value]).filter(
              (id): id is string =>
                typeof id === "string" && Types.ObjectId.isValid(id),
            );
          }),
        ),
      ];
      const items = ids.length
        ? await connection
            .collection(reference.collection)
            .find(
              { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
              {
                projection: Object.fromEntries(
                  reference.fields.map((field) => [field, 1]),
                ),
              },
            )
            .toArray()
        : [];
      const byId = new Map(
        items.map((item) => {
          const { _id, ...fields } = item;
          return [String(_id), { id: String(_id), ...fields }];
        }),
      );
      targets.forEach((row) => {
        if (!Object.prototype.hasOwnProperty.call(row, reference.field))
          return;
        const value = row[reference.field];
        (row as Record<string, unknown>)[reference.as] = Array.isArray(value)
          ? value.map((id) => byId.get(String(id)) ?? null)
          : (byId.get(String(value)) ?? null);
      });
    }),
  );
  return result;
}
export const classDisplayReferences: ReferenceSummary[] = [
  {
    field: "clubId",
    as: "club",
    collection: "clubs",
    fields: ["name", "slug"],
  },
  {
    field: "sportId",
    as: "sport",
    collection: "sports",
    fields: ["name", "slug"],
  },
  {
    field: "skillLevelId",
    as: "skillLevel",
    collection: "skill_levels",
    fields: ["name"],
  },
  {
    field: "coachId",
    as: "coach",
    collection: "coaches",
    fields: ["displayName", "slug"],
  },
  {
    field: "ownerCoachId",
    as: "ownerCoach",
    collection: "coaches",
    fields: ["displayName", "slug"],
  },
  {
    field: "offeringId",
    as: "offering",
    collection: "coach_services",
    fields: ["title", "description"],
  },
  {
    field: "coachProfileId",
    as: "coachProfile",
    collection: "club_coach_profiles",
    fields: ["firstName", "lastName"],
  },
  {
    field: "branchId",
    as: "branch",
    collection: "club_branches",
    fields: ["name", "address"],
  },
  {
    field: "requiredEquipmentIds",
    as: "requiredEquipment",
    collection: "equipment",
    fields: ["name"],
  },
  {
    field: "amenityIds",
    as: "amenities",
    collection: "amenities",
    fields: ["name"],
  },
];
export const studentDisplayReference: ReferenceSummary = {
  field: "studentId",
  as: "student",
  collection: "club_students",
  fields: ["firstName", "lastName"],
};
