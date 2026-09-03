import { ClubFieldsSchema, type ClubFields } from "./club-fields.dto";

export class CreateClubDto implements ClubFields {
  static schema = ClubFieldsSchema;
  name: ClubFields["name"];
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
