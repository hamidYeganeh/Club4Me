import { ClubFieldsSchema, type ClubFields } from "./club-fields.dto";

const UpdateClubSchema = ClubFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

export class UpdateClubDto implements Partial<ClubFields> {
  static schema = UpdateClubSchema;
  name?: ClubFields["name"];
  description?: ClubFields["description"];
  gallery?: ClubFields["gallery"];
  equipment?: ClubFields["equipment"];
  amenities?: ClubFields["amenities"];
  rules?: ClubFields["rules"];
  location?: ClubFields["location"];
  socialMedia?: ClubFields["socialMedia"];
  clubTypeIds?: ClubFields["clubTypeIds"];
  tags?: ClubFields["tags"];
  cancellationRules?: ClubFields["cancellationRules"];
}
