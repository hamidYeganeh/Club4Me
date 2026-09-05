import {
  ClubFieldsObjectSchema,
  refineClubFields,
  type ClubFields,
} from "./club-fields.dto";

const UpdateClubSchema = ClubFieldsObjectSchema.partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  )
  .superRefine(refineClubFields);

export class UpdateClubDto implements Partial<ClubFields> {
  static schema = UpdateClubSchema;
  name?: ClubFields["name"];
  shortDescription?: ClubFields["shortDescription"];
  description?: ClubFields["description"];
  faqs?: ClubFields["faqs"];
  logoMediaId?: ClubFields["logoMediaId"];
  coverMediaId?: ClubFields["coverMediaId"];
  gallery?: ClubFields["gallery"];
  equipment?: ClubFields["equipment"];
  amenities?: ClubFields["amenities"];
  rules?: ClubFields["rules"];
  location?: ClubFields["location"];
  socialMedia?: ClubFields["socialMedia"];
  clubTypeIds?: ClubFields["clubTypeIds"];
  sportIds?: ClubFields["sportIds"];
  tags?: ClubFields["tags"];
  weeklyHours?: ClubFields["weeklyHours"];
  closures?: ClubFields["closures"];
  audience?: ClubFields["audience"];
  minAge?: ClubFields["minAge"];
  maxAge?: ClubFields["maxAge"];
  currency?: ClubFields["currency"];
  taxPercent?: ClubFields["taxPercent"];
  operationalStatus?: ClubFields["operationalStatus"];
  cancellationRules?: ClubFields["cancellationRules"];
}
