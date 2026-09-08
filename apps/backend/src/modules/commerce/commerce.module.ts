import {
  CoachPackagePurchase,
  CoachPackagePurchaseSchema,
} from "../coaching/schemas/coach-purchase.schema";
import {
  CoachOffering,
  CoachOfferingSchema,
  Coach,
  CoachSchema,
  SessionBooking,
  SessionBookingSchema,
  ClassEnrollment,
  ClassEnrollmentSchema,
  TrainingSession,
  TrainingSessionSchema,
  TrainingClass,
  TrainingClassSchema,
} from "../coaching/schemas/coaching.schemas";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppConfigModule } from "../../config/app-config.module";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ClubsModule } from "../clubs/clubs.module";
import { BusinessOperationsModule } from "../business-operations/business-operations.module";
import {
  Reservation,
  ReservationSchema,
} from "../reservations/schemas/reservation.schema";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "../reservations/schemas/reservable-session.schema";
import {
  AdminCommerceController,
  CommerceController,
  PayoutsController,
} from "./commerce.controller";
import { CommerceService } from "./commerce.service";
import { CommerceJobsService } from "./commerce-jobs.service";
import { EntitlementsService } from "./entitlements.service";
import { MembershipRemindersService } from "./membership-reminders.service";
import {
  BenefitPurchasesController,
  BusinessBenefitProductsController,
  PublicBenefitProductsController,
} from "./entitlements.controller";
import { MockPaymentProvider } from "./mock-payment.provider";
import { PayoutsService } from "./payouts.service";
import { BenefitsService } from "./benefits.service";
import {
  AdminBenefitsController,
  BenefitsController,
} from "./benefits.controller";
import {
  DiscountCampaign,
  DiscountCampaignSchema,
  DiscountRedemption,
  DiscountRedemptionSchema,
  Referral,
  ReferralCode,
  ReferralCodeSchema,
  ReferralSchema,
  WalletAccount,
  WalletAccountSchema,
  WalletTransaction,
  WalletTransactionSchema,
} from "./schemas/benefits.schema";
import {
  LedgerEntry,
  LedgerEntrySchema,
  PaymentCallbackEvent,
  PaymentCallbackEventSchema,
  PaymentIntent,
  PaymentIntentSchema,
  PayoutRequest,
  PayoutRequestSchema,
  SettlementAccount,
  SettlementAccountSchema,
} from "./schemas/commerce.schema";
import {
  BenefitProduct,
  BenefitProductSchema,
  BenefitPurchase,
  BenefitPurchaseSchema,
  EntitlementUsage,
  EntitlementUsageSchema,
  UserEntitlement,
  UserEntitlementSchema,
} from "./schemas/entitlement.schema";

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    AppConfigModule,
    ClubsModule,
    BusinessOperationsModule,
    MongooseModule.forFeature([
      { name: CoachPackagePurchase.name, schema: CoachPackagePurchaseSchema },
      { name: CoachOffering.name, schema: CoachOfferingSchema },
      { name: Coach.name, schema: CoachSchema },
      { name: SessionBooking.name, schema: SessionBookingSchema },
      { name: ClassEnrollment.name, schema: ClassEnrollmentSchema },
      { name: TrainingSession.name, schema: TrainingSessionSchema },
      { name: TrainingClass.name, schema: TrainingClassSchema },
      { name: PaymentIntent.name, schema: PaymentIntentSchema },
      { name: PaymentCallbackEvent.name, schema: PaymentCallbackEventSchema },
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
      { name: PayoutRequest.name, schema: PayoutRequestSchema },
      { name: SettlementAccount.name, schema: SettlementAccountSchema },
      { name: WalletAccount.name, schema: WalletAccountSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: DiscountCampaign.name, schema: DiscountCampaignSchema },
      { name: DiscountRedemption.name, schema: DiscountRedemptionSchema },
      { name: ReferralCode.name, schema: ReferralCodeSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: BenefitProduct.name, schema: BenefitProductSchema },
      { name: BenefitPurchase.name, schema: BenefitPurchaseSchema },
      { name: UserEntitlement.name, schema: UserEntitlementSchema },
      { name: EntitlementUsage.name, schema: EntitlementUsageSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: ReservableSession.name, schema: ReservableSessionSchema },
    ]),
  ],
  controllers: [
    CommerceController,
    PayoutsController,
    AdminCommerceController,
    BenefitsController,
    AdminBenefitsController,
    BusinessBenefitProductsController,
    PublicBenefitProductsController,
    BenefitPurchasesController,
  ],
  providers: [
    MembershipRemindersService,
    CommerceService,
    PayoutsService,
    BenefitsService,
    MockPaymentProvider,
    CommerceJobsService,
    EntitlementsService,
  ],
  exports: [
    CommerceService,
    PayoutsService,
    BenefitsService,
    EntitlementsService,
  ],
})
export class CommerceModule {}
