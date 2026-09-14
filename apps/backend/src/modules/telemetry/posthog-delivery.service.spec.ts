import { Types } from "mongoose";
import {
  PosthogDeliveryService,
  toPosthogEvent,
} from "./posthog-delivery.service";
import { outcomeId } from "./outcome-sync.service";
import { ProductTelemetry } from "./schemas/product-telemetry.schema";
const row = {
  eventId: outcomeId("test"),
  kind: "track",
  event: "discovery.club_viewed",
  anonymousHash: "hashed-install",
  actorId: null,
  properties: { club_id: "club-1" },
  occurredAt: new Date(),
  expiresAt: new Date(Date.now() + 86400_000),
  environment: "test",
  platform: "web",
  appVersion: "1",
  backendRelease: "test",
  source: "client",
  posthogAttempts: 0,
  roles: [],
  traits: {},
  posthogDeliveredAt: null,
  posthogRetryAt: null,
  receivedAt: new Date(),
  consentVersion: "2026-09-13",
} satisfies ProductTelemetry;
describe("PostHog durable delivery", () => {
  it("uses deterministic UUIDs across retries", () => {
    expect(outcomeId("abc")).toBe(outcomeId("abc"));
    expect(outcomeId("abc")).not.toBe(outcomeId("def"));
    expect(outcomeId("abc")).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    );
  });
  it("maps anonymous, identified and group records with explicit group context", () => {
    expect(toPosthogEvent(row)).toMatchObject({
      uuid: row.eventId,
      properties: {
        $process_person_profile: false,
        $ip: null,
        $groups: { club: "club-1" },
      },
    });
    expect(
      toPosthogEvent({
        ...row,
        kind: "identify",
        actorId: new Types.ObjectId(),
        traits: { locale: "fa-IR" },
      }),
    ).toMatchObject({
      event: "$identify",
      properties: {
        $anon_distinct_id: "anon:hashed-install",
        $set: { locale: "fa-IR" },
      },
    });
    const id = new Types.ObjectId();
    expect(
      toPosthogEvent({
        ...row,
        kind: "group",
        groupType: "club",
        groupId: id,
        traits: { status: "active" },
      }),
    ).toMatchObject({
      event: "$groupidentify",
      properties: {
        $group_type: "club",
        $group_key: String(id),
        $group_set: { status: "active" },
      },
    });
  });
  const setup = () => {
    const updateOne = jest.fn().mockResolvedValue({}),
      updateMany = jest.fn().mockResolvedValue({});
    const chain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest
        .fn()
        .mockResolvedValue([{ ...row, _id: new Types.ObjectId() }]),
    };
    const model = {
      find: jest.fn().mockReturnValue(chain),
      updateOne,
      updateMany,
    };
    const config = {
      env: {
        NODE_ENV: "test",
        POSTHOG_ENVIRONMENT: "test",
        POSTHOG_HOST: "https://eu.i.posthog.com",
        POSTHOG_PROJECT_TOKEN: "test-token",
      },
    };
    return {
      service: new PosthogDeliveryService(model as never, config as never),
      model,
    };
  };
  afterEach(() => jest.restoreAllMocks());
  it("acknowledges only successful delivery", async () => {
    const { service, model } = setup();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);
    await service.run();
    expect(model.updateMany).toHaveBeenCalled();
    expect(model.updateOne).not.toHaveBeenCalled();
  });
  it("retains failed deliveries and schedules bounded backoff", async () => {
    const { service, model } = setup();
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await service.run();
    expect(model.updateMany).not.toHaveBeenCalled();
    expect(model.updateOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $inc: { posthogAttempts: 1 } }),
    );
  });
});
