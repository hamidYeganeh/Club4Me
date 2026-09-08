import type { ClubCancellationRule } from "../business/business-clubs.dto";

export type ClubCourt = {
  id: string;
  clubId: string;
  name: string;
  code?: string;
  courtTypeId?: string;
  sportIds: string[];
  description: string;
  capacity: number;
  environment: "indoor" | "outdoor" | "covered";
  surfaceTypeId?: string;
  lengthMeters?: number;
  widthMeters?: number;
  locationLabel?: string;
  floor?: string;
  galleryMediaIds: string[];
  isReservable: boolean;
  minimumReservationMinutes: number;
  maximumReservationMinutes: number;
  preparationMinutes: number;
  cleanupMinutes: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};
export type ClubCoachSummary = {
  id: string;
  displayName: string;
  slug: string;
};
export type ClubClassSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
};
export type SessionOption = {
  id: string;
  type: "equipment" | "amenity";
  resourceId: string;
  title?: string;
  availableQuantity: number;
  reservedQuantity: number;
  maxPerReservation: number;
  unitPrice: number;
};
export type ReservableSession = {
  id: string;
  clubId: string;
  courtId?: string;
  coachId?: string;
  classId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
  basePrice: number;
  currency: string;
  pricingUnit: "per_participant" | "per_session" | "per_court";
  options: SessionOption[];
  cancellationPolicy: ClubCancellationRule;
  status: "active" | "cancelled" | "completed";
};
export type SessionReservation = {
  rescheduledFromId?: string | null;
  rescheduledToId?: string | null;
  isTrial?: boolean;
  id: string;
  clubId: string;
  sessionId: string;
  userId: string;
  sessionType: "court" | "class" | "coached_session";
  sessionTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  participantCount: number;
  checkedInParticipants?: number;
  checkedInAt?: string | null;
  selectedOptions: Array<{
    optionId: string;
    type: "equipment" | "amenity";
    resourceId: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
  currency?: string;
  pricingUnit?: ReservableSession["pricingUnit"];
  priceBreakdown?: Record<string, number> | null;
  paymentExpiresAt?: string | null;
  entitlementId: string | null;
  entitlementCoveredAmount: number;
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded";
  cancellationPolicy: ClubCancellationRule;
  refundPercent: number | null;
  refundAmount: number | null;
  status: "reserved" | "cancelled" | "completed" | "no_show";
  createdAt: string;
  cancelledAt: string | null;
};
export type CreateCourtPayload = {
  name: string;
  code?: string;
  courtTypeId?: string;
  sportIds?: string[];
  description?: string;
  capacity: number;
  environment?: "indoor" | "outdoor" | "covered";
  surfaceTypeId?: string;
  lengthMeters?: number;
  widthMeters?: number;
  locationLabel?: string;
  floor?: string;
  galleryMediaIds?: string[];
  isReservable?: boolean;
  minimumReservationMinutes?: number;
  maximumReservationMinutes?: number;
  preparationMinutes?: number;
  cleanupMinutes?: number;
};
export type UpdateCourtPayload = Partial<
  Omit<
    CreateCourtPayload,
    "courtTypeId" | "surfaceTypeId" | "lengthMeters" | "widthMeters"
  >
> & {
  courtTypeId?: string | null;
  surfaceTypeId?: string | null;
  lengthMeters?: number | null;
  widthMeters?: number | null;
  status?: ClubCourt["status"];
  expectedUpdatedAt?: string;
};
export type CreateSessionPayload = {
  title: string;
  courtId?: string;
  coachId?: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  basePrice: number;
  currency?: string;
  pricingUnit?: "per_participant" | "per_session" | "per_court";
  options?: Array<{
    type: "equipment" | "amenity";
    resourceId: string;
    title?: string;
    availableQuantity: number;
    maxPerReservation: number;
    unitPrice: number;
  }>;
  cancellationPolicy: ClubCancellationRule;
};
export type CreateReservationPayload = {
  isTrial?: boolean;
  sessionId: string;
  expectedTotalPrice?: number;
  expectedCurrency?: string;
  participantCount: number;
  entitlementId?: string;
  options?: Array<{ optionId: string; quantity: number }>;
};

export type ReservationQuote = {
  sessionId: string;
  currency: string;
  pricingUnit: ReservableSession["pricingUnit"];
  participantCount: number;
  baseAmount: number;
  optionsAmount: number;
  coveredAmount: number;
  totalPrice: number;
  taxPercent: number;
  taxAmount: number;
  subtotal: number;
};
