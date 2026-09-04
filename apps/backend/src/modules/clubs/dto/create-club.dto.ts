import { ClubFieldsSchema, type ClubFields } from "./club-fields.dto";

export class CreateClubDto implements ClubFields {
  static schema = ClubFieldsSchema;
  name: ClubFields["name"];
  shortDescription?: ClubFields["shortDescription"];
  description?: ClubFields["description"];
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
