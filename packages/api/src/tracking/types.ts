export type TelemetryPlatform = "android" | "web";
export type ProductRole = "athlete" | "coach" | "owner";
export type SessionType = "court" | "class" | "coached_session";

export interface UserTraits {
  created_at: string;
  locale: string;
  platform: TelemetryPlatform;
}

export interface ClubTraits {
  status: string;
  club_type_id?: string;
  city_id?: string;
  created_at: string;
}

export interface SessionTraits {
  parent_group_id: string;
  session_type: SessionType;
  status: string;
  starts_at: string;
}

export interface UserSignedUpEvent {
  signup_method: "otp" | "password";
  initial_role: ProductRole;
}

export interface OnboardingCompletedEvent {
  selected_role: ProductRole;
}

export interface SearchPerformedEvent {
  result_type: "all" | "club" | "coach" | "class";
  has_location_filter: boolean;
  result_count: number;
  acquisition_channel?: string;
  sport_id?: string;
  service_type?: "club" | "coach" | "class" | "court";
}

export interface DiscoveryClubViewedEvent {
  club_id: string;
}

export interface CheckoutStartedEvent {
  club_id: string;
  session_id: string;
}

export interface PaymentSucceededEvent {
  reservation_id: string;
  club_id: string;
}

export interface FavoriteAddedEvent {
  favorite_type: "club" | "coach" | "class" | "article";
  favorite_id: string;
  club_id?: string;
}

export interface ReviewSubmittedEvent {
  review_target_type: "club" | "coach" | "class";
  review_target_id: string;
  rating: number;
}

export interface ReservationCreatedEvent {
  reservation_id: string;
  club_id: string;
  session_id: string;
  session_type: SessionType;
  participant_count: number;
}

export interface ReservationCancelledEvent {
  reservation_id: string;
  club_id: string;
  session_id: string;
  cancelled_by: "athlete" | "provider";
}

export interface SessionPublishedEvent {
  club_id: string;
  session_id: string;
  session_type: SessionType;
}

export interface NotificationPreferenceChangedEvent {
  preference_name:
    | "push_enabled"
    | "booking_updates"
    | "reminders"
    | "discovery"
    | "marketing";
  is_enabled: boolean;
}

export interface AccountDeletedEvent {
  had_active_roles: boolean;
}
