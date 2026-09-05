import { Injectable } from "@nestjs/common";
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { AppConfigService } from "../../config/app-config.service";
import type { MockPaymentCallbackDto } from "./commerce.dto";

@Injectable()
export class MockPaymentProvider {
  readonly name = "mock" as const;
  constructor(private readonly config: AppConfigService) {}

  createAuthority() {
    return `mock_${randomBytes(24).toString("hex")}`;
  }

  async createPayment(_input: {
    amount: number;
    callbackUrl: string;
    description: string;
  }) {
    const authority = this.createAuthority();
    return { authority, checkoutUrl: `/payments/mock/${authority}` };
  }

  async verifyPayment() {
    return {
      status: "failed" as const,
      eventId: `mock:verify:${randomUUID()}`,
    };
  }

  async inquirePayment() {
    return "pending" as const;
  }

  createCallback(input: {
    intentId: string;
    authority: string;
    amount: number;
    status: "paid" | "failed";
  }) {
    const payload: MockPaymentCallbackDto = {
      eventId: randomUUID(),
      intentId: input.intentId,
      authority: input.authority,
      amount: input.amount,
      status: input.status,
      timestamp: Date.now(),
      nonce: randomBytes(24).toString("hex"),
    };
    return { payload, signature: this.sign(payload) };
  }

  assertSignature(payload: MockPaymentCallbackDto, signature?: string) {
    if (!signature || Math.abs(Date.now() - payload.timestamp) > 5 * 60_000) {
      return false;
    }
    const expected = Buffer.from(this.sign(payload), "hex");
    const received = Buffer.from(signature, "hex");
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  sign(payload: MockPaymentCallbackDto) {
    return createHmac("sha256", this.config.env.MOCK_PAYMENT_CALLBACK_SECRET)
      .update(canonicalPayload(payload))
      .digest("hex");
  }
}

function canonicalPayload(payload: MockPaymentCallbackDto) {
  return [
    payload.eventId,
    payload.intentId,
    payload.authority,
    payload.status,
    payload.amount,
    payload.timestamp,
    payload.nonce,
  ].join("|");
}
