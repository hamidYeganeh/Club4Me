export type ClubProfile = {
  spaces?: Array<{
    name: string;
    floorTypeId?: string;
    roofTypeId?: string;
    lightingTypeId?: string;
    waterTreatmentTypeId?: string;
    floorType?: string;
    roofType?: "open" | "covered" | "retractable" | "partial";
    lighting?: string;
    courtCount?: number;
    areaSquareMeters?: number;
    poolLengthMeters?: number;
    poolLaneCount?: number;
    poolMinDepthMeters?: number;
    poolMaxDepthMeters?: number;
    waterTreatment?: string;
  }>;
  trainingAreaSquareMeters?: number;
  ventilationTypeId?: string;
  coolingTypeId?: string;
  parkingTypeId?: string;
  accessibilityTypeId?: string;
  classCapacity?: number;
  ventilation?: string;
  cooling?: string;
  parking?: string;
  wheelchairAccess?: "yes" | "partial" | "no" | "unknown";
  firstVisit?: {
    requiredItemIds?: string[];
    requiredItems?: string[];
    arrivalMinutesBefore?: number;
    instructions?: string;
    visitAvailable?: boolean;
    extraFees?: string;
  };
};
export type ClubBusyHour = {
  dayOfWeek: number;
  hour: number;
  level: "quiet" | "moderate" | "busy";
};
export type ClubGalleryCategory =
  "training" | "equipment" | "changing_room" | "entrance" | "other";
export type ClubVerifications = Partial<
  Record<"identity" | "documents" | "on_site", { verifiedAt: string }>
>;
