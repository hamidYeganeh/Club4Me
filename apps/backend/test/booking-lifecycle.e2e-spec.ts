import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { Types } from "mongoose";
import request from "supertest";
import type { App } from "supertest/types";

import { ZodValidationPipe } from "../src/common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../src/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../src/modules/auth/guards/roles.guard";
import { CommerceController } from "../src/modules/commerce/commerce.controller";
import { CommerceService } from "../src/modules/commerce/commerce.service";
import {
  PublicSessionsController,
  ReservationsController,
} from "../src/modules/reservations/reservations.controller";
import { ReservationsService } from "../src/modules/reservations/reservations.service";

describe("Discovery to cancellation booking lifecycle e2e", () => {
  let app: INestApplication;
  let http: App;

  const clubId = new Types.ObjectId().toHexString();
  const sessionId = new Types.ObjectId().toHexString();
  const reservationId = new Types.ObjectId().toHexString();
  const intentId = new Types.ObjectId().toHexString();
  let paymentStatus: "pending" | "paid" | "refunded" = "pending";

  const reservation = () => ({
    id: reservationId,
    clubId,
    sessionId,
    sessionTitle: "سانس تست رزرو",
    participantCount: 1,
    totalPrice: 500_000,
    status: paymentStatus === "refunded" ? "cancelled" : "reserved",
    paymentStatus,
  });

  beforeAll(async () => {
    const reservations = {
      listPublicSessions: jest.fn().mockResolvedValue({
        items: [
          {
            id: sessionId,
            clubId,
            title: "سانس تست رزرو",
            remainingCapacity: 4,
          },
        ],
      }),
      reserve: jest
        .fn()
        .mockImplementation(() => Promise.resolve(reservation())),
      cancel: jest.fn().mockImplementation(() => {
        if (paymentStatus !== "paid")
          throw new Error("Payment must be captured first");
        paymentStatus = "refunded";
        return Promise.resolve(reservation());
      }),
    };
    const commerce = {
      createIntent: jest.fn().mockResolvedValue({
        id: intentId,
        referenceId: reservationId,
        amount: 500_000,
        status: "pending",
      }),
      simulate: jest.fn().mockImplementation(() => {
        paymentStatus = "paid";
        return Promise.resolve({
          id: intentId,
          status: "paid",
          referenceId: reservationId,
        });
      }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [
        PublicSessionsController,
        ReservationsController,
        CommerceController,
      ],
      providers: [
        { provide: ReservationsService, useValue: reservations },
        { provide: CommerceService, useValue: commerce },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestAuthGuard())
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    http = app.getHttpServer() as App;
  });

  afterAll(async () => app.close());

  it("discovers, reserves, pays and cancels in the required order", async () => {
    const discovery = await request(http)
      .get(`/api/v1/public/clubs/${clubId}/reservable-sessions`)
      .expect(200);
    expect(discovery.body.items[0].id).toBe(sessionId);

    const booking = await request(http)
      .post("/api/v1/reservations")
      .send({ sessionId, participantCount: 1 })
      .expect(201);
    expect(booking.body).toMatchObject({
      id: reservationId,
      paymentStatus: "pending",
    });

    const intent = await request(http)
      .post("/api/v1/payments/intents")
      .send({
        referenceType: "reservation",
        referenceId: reservationId,
        idempotencyKey: "e2e-booking-payment",
        returnUrl: "https://club4me.test/payment-return",
        walletAmount: 0,
      })
      .expect(201);
    expect(intent.body.id).toBe(intentId);

    const payment = await request(http)
      .post(`/api/v1/payments/intents/${intentId}/mock/decision`)
      .send({ status: "paid" })
      .expect(201);
    expect(payment.body.status).toBe("paid");

    const cancellation = await request(http)
      .patch(`/api/v1/reservations/${reservationId}/cancel`)
      .expect(200);
    expect(cancellation.body).toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
    });
  });
});

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().user = {
      sub: new Types.ObjectId().toHexString(),
      roles: ["athlete"],
    };
    return true;
  }
}
