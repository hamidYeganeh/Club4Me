import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { SupportReferencesService } from "./support-references.service";
import { SupportService } from "./support.service";
import { SupportTicketSchema } from "./support.schema";
import { CreateTicketDto } from "./support.dto";

describe("support order references", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let db: Connection;
  let references: SupportReferencesService;
  let service: SupportService;
  const userId = new Types.ObjectId();
  const otherUser = new Types.ObjectId();
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    references = new SupportReferencesService(db);
    service = new SupportService(
      db.model("SupportTicket", SupportTicketSchema) as never,
      {} as never,
      { env: { SUPPORT_SLA_NORMAL_MINUTES: 480 } } as never,
      references,
    );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  const payload = (referenceId: string) => ({
    subject: "پیگیری رزرو",
    category: "reservation" as const,
    message: "لطفاً وضعیت رزرو را بررسی کنید",
    priority: "normal" as const,
    preferredContact: "in_app" as const,
    referenceType: "reservation" as const,
    referenceId,
  });

  it("persists an owned reference, exposes it to its owner, and returns minimal admin payment context", async () => {
    const order = {
      _id: new Types.ObjectId(),
      userId,
      sessionTitle: "زمین تنیس",
      status: "reserved",
      paymentStatus: "paid",
      totalPrice: 6000000,
      currency: "IRR",
      createdAt: new Date(),
    };
    await db.collection("session_reservations").insertOne(order);
    await db.collection("payment_intents").insertOne({
      userId,
      referenceId: order._id,
      referenceType: "reservation",
      amount: 6000000,
      grossAmount: 6000000,
      status: "paid",
      authority: "private-authority",
      returnUrl: "private-url",
      paidAt: new Date(),
      createdAt: new Date(),
    });
    const ticket = await service.create(
      String(userId),
      payload(String(order._id)),
    );
    expect(ticket).toMatchObject({
      referenceType: "reservation",
      referenceId: String(order._id),
    });
    expect(
      (await service.listMine(String(userId))).items.find(
        (item) => item.id === ticket.id,
      )?.referenceId,
    ).toBe(String(order._id));
    const context = await service.context(ticket.id);
    expect(context.order).toMatchObject({
      id: String(order._id),
      title: "زمین تنیس",
      amount: 6000000,
    });
    expect(context.payments).toHaveLength(1);
    expect(context.payments[0]).toMatchObject({
      status: "paid",
      amount: 6000000,
    });
    expect(JSON.stringify(context)).not.toMatch(
      /private-authority|private-url/,
    );
  });

  it("rejects another athlete's reservation without creating a ticket", async () => {
    const id = new Types.ObjectId();
    await db
      .collection("session_reservations")
      .insertOne({ _id: id, userId: otherUser });
    await expect(
      service.create(String(userId), payload(String(id))),
    ).rejects.toMatchObject({ code: "SUPPORT_REFERENCE_NOT_FOUND" });
    expect(
      await db
        .collection("support_tickets")
        .countDocuments({ referenceId: id }),
    ).toBe(0);
  });

  it.each([
    ["coach_booking", "session_bookings"],
    ["class_enrollment", "class_enrollments"],
  ] as const)(
    "checks athleteId for %s instead of trusting the reference",
    async (type, collection) => {
      const id = new Types.ObjectId();
      await db.collection(collection).insertOne({ _id: id, athleteId: userId });
      await expect(
        references.requireOwned(String(userId), type, String(id)),
      ).resolves.toMatchObject({ _id: id });
      await expect(
        references.requireOwned(String(otherUser), type, String(id)),
      ).rejects.toMatchObject({ code: "SUPPORT_REFERENCE_NOT_FOUND" });
    },
  );

  it("resolves business enrollment ownership through its student and club", async () => {
    const id = new Types.ObjectId(),
      studentId = new Types.ObjectId(),
      clubId = new Types.ObjectId();
    await db
      .collection("club_students")
      .insertOne({ _id: studentId, userId, clubId });
    await db
      .collection("business_class_enrollments")
      .insertOne({ _id: id, studentId, clubId });
    await expect(
      references.requireOwned(
        String(userId),
        "business_class_enrollment",
        String(id),
      ),
    ).resolves.toMatchObject({ _id: id });
    await expect(
      references.requireOwned(
        String(otherUser),
        "business_class_enrollment",
        String(id),
      ),
    ).rejects.toMatchObject({ code: "SUPPORT_REFERENCE_NOT_FOUND" });
    await db
      .collection("business_class_enrollments")
      .updateOne({ _id: id }, { $set: { clubId: new Types.ObjectId() } });
    await expect(
      references.requireOwned(
        String(userId),
        "business_class_enrollment",
        String(id),
      ),
    ).rejects.toMatchObject({ code: "SUPPORT_REFERENCE_NOT_FOUND" });
  });

  it("requires both reference fields and rejects unsupported collections", () => {
    const input = payload(String(new Types.ObjectId()));
    expect(CreateTicketDto.schema.safeParse(input).success).toBe(true);
    expect(
      CreateTicketDto.schema.safeParse({ ...input, referenceId: undefined })
        .success,
    ).toBe(false);
    expect(
      CreateTicketDto.schema.safeParse({ ...input, referenceType: "users" })
        .success,
    ).toBe(false);
  });
});
