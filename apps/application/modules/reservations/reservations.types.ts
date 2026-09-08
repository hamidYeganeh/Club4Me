import type { SessionReservation } from "@api";

export type TimelineReservation = Pick<
  SessionReservation,
  | "id"
  | "sessionTitle"
  | "sessionStartsAt"
  | "sessionEndsAt"
  | "participantCount"
  | "status"
  | "totalPrice"
  | "paymentStatus"
  | "refundPercent"
  | "refundAmount"
> & {
  source?: "club" | "coach" | "class";
  sourceId?: string;
  clubId?: string;
  sessionId?: string;
  changeTimeHref?: string;
  cancellationPolicyTitle?: string;
  paymentExpiresAt?: string | null;
};

export type ReservationDateOption = {
  key: string;
  weekday: string;
  day: string;
};
