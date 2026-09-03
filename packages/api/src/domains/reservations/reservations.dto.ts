import type { ClubCancellationRule } from "../business/business-clubs.dto";

export type ClubCourt = {
  id: string;
  clubId: string;
  name: string;
  courtTypeId?: string;
  description: string;
  capacity: number;
  isReservable: boolean;
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
  options: SessionOption[];
  cancellationPolicy: ClubCancellationRule;
  status: "active" | "cancelled" | "completed";
};
export type SessionReservation = {
  id: string;
  clubId: string;
  sessionId: string;
  userId: string;
  sessionTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  participantCount: number;
  selectedOptions: Array<{
    optionId: string;
    type: "equipment" | "amenity";
    resourceId: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
  cancellationPolicy: ClubCancellationRule;
  refundPercent: number | null;
  refundAmount: number | null;
  status: "reserved" | "cancelled" | "completed" | "no_show";
  createdAt: string;
  cancelledAt: string | null;
};
export type CreateCourtPayload = {
  name: string;
  courtTypeId?: string;
  description?: string;
  capacity: number;
  isReservable?: boolean;
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
  sessionId: string;
  participantCount: number;
  options?: Array<{ optionId: string; quantity: number }>;
};
