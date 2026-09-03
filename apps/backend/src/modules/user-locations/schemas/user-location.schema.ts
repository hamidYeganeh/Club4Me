import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
export class UserLocationGeo {
  @Prop({ type: Types.ObjectId, required: true })
  countryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  provinceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  cityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  districtId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, default: null })
  cityRegionId: Types.ObjectId | null;
}

@Schema({ _id: false })
export class GeoJsonPoint {
  @Prop({ type: String, enum: ["Point"], required: true })
  type: "Point";

  @Prop({ type: [Number], required: true })
  coordinates: [number, number];
}

@Schema({ collection: "user_locations", timestamps: true })
export class UserLocation {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 30 })
  title: string;

  @Prop({ type: UserLocationGeo, required: true })
  geo: UserLocationGeo;

  @Prop({ required: true, trim: true, maxlength: 300 })
  address: string;

  @Prop({ type: GeoJsonPoint, required: true })
  location: GeoJsonPoint;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  // Internal allocation slot makes the five-location limit race-safe.
  @Prop({ type: Number, min: 0, max: 4, required: true, select: false })
  slot: number;

  createdAt: Date;
  updatedAt: Date;
}

export type UserLocationDocument = HydratedDocument<UserLocation>;
export const UserLocationSchema = SchemaFactory.createForClass(UserLocation);

UserLocationSchema.index({ location: "2dsphere" });
UserLocationSchema.index({ userId: 1, slot: 1 }, { unique: true });
UserLocationSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
    name: "one_default_location_per_user",
  },
);
