import { randomBytes, createHash } from "node:crypto";
import { Types, type Connection } from "mongoose";
import { z } from "zod";
import { parse } from "../../lib/validate";
import { AppError } from "../../common/errors/app.exception";

const key = (s: string) =>
  new Types.ObjectId(parse(z.string().regex(/^[a-f\d]{24}$/i), s));
const missing = () =>
  new AppError(404, "GROUP_NOT_FOUND", "گروه در دسترس نیست");
type Group = {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  goal: number;
  members: Types.ObjectId[];
  inviteHash: string;
  active: boolean;
  createdAt: Date;
};

/** A private, opt-in group scoped to an active class. Workout and contact data never enter its DTO. */
export class ClassGroups {
  constructor(private db: Connection) {}
  private groups() {
    return this.db.collection<Group>("class_training_groups");
  }
  private async eligible(userId: string, classId: string) {
    const students = await this.db
      .collection("club_students")
      .find({ userId: key(userId) })
      .project({ _id: 1 })
      .toArray();
    const course = await this.db
      .collection("business_training_classes")
      .findOne({
        _id: key(classId),
        status: "active",
        endDate: { $gt: new Date() },
      });
    const enrolled = await this.db
      .collection("business_class_enrollments")
      .findOne({
        classId: key(classId),
        studentId: { $in: students.map((s) => s._id) },
        status: "active",
        paymentStatus: { $in: ["paid", "waived"] },
      });
    if (!course || !enrolled)
      throw new AppError(
        403,
        "ENROLLMENT_REQUIRED",
        "برای عضویت در گروه، ثبت‌نام فعال و تسویه‌شده این کلاس لازم است",
      );
    return course;
  }
  async list(userId: string, classId: string) {
    await this.eligible(userId, classId);
    const groups = await this.groups()
      .find({ classId: key(classId), members: key(userId), active: true })
      .toArray();
    return { items: await Promise.all(groups.map((g) => this.dto(g, userId))) };
  }
  async create(userId: string, classId: string, body: unknown) {
    const input = parse(
      z.object({
        title: z.string().trim().min(1).max(80),
        goal: z.number().int().min(1).max(7),
        accepted: z.literal(true),
      }),
      body,
    );
    await this.eligible(userId, classId);
    // One owned group per class; a network retry returns the same group.
    const _id = new Types.ObjectId(
      createHash("sha256")
        .update(`${classId}:${userId}`)
        .digest("hex")
        .slice(0, 24),
    );
    await this.groups().updateOne(
      { _id },
      {
        $setOnInsert: {
          classId: key(classId),
          ownerId: key(userId),
          title: input.title,
          goal: input.goal,
          members: [key(userId)],
          inviteHash: "",
          active: true,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    await this.groups().updateOne(
      { _id, ownerId: key(userId), active: false },
      {
        $set: {
          title: input.title,
          goal: input.goal,
          members: [key(userId)],
          inviteHash: "",
          active: true,
          createdAt: new Date(),
        },
      },
    );
    const group = await this.groups().findOne({ _id, active: true });
    if (!group) throw missing();
    return this.dto(group, userId);
  }
  async invite(userId: string, groupId: string) {
    const group = await this.groups().findOne({
      _id: key(groupId),
      ownerId: key(userId),
      active: true,
    });
    if (!group) throw missing();
    await this.eligible(userId, String(group.classId));
    const token = randomBytes(24).toString("hex");
    await this.groups().updateOne(
      { _id: group._id, active: true },
      {
        $set: { inviteHash: createHash("sha256").update(token).digest("hex") },
      },
    );
    return { token, classId: String(group.classId) };
  }
  async join(userId: string, classId: string, body: unknown) {
    const { token } = parse(
      z.object({
        token: z.string().regex(/^[a-f0-9]{48}$/),
        accepted: z.literal(true),
      }),
      body,
    );
    await this.eligible(userId, classId);
    const hash = createHash("sha256").update(token).digest("hex");
    const filter = { classId: key(classId), inviteHash: hash, active: true };
    const existing = await this.groups().findOne({
      ...filter,
      members: key(userId),
    });
    if (existing) return this.dto(existing, userId);
    const group = await this.groups().findOneAndUpdate(
      { ...filter, "members.7": { $exists: false } },
      { $addToSet: { members: key(userId) } },
      { returnDocument: "after" },
    );
    if (!group)
      throw new AppError(
        409,
        "INVITE_UNAVAILABLE",
        "دعوت معتبر نیست یا گروه هشت عضو دارد",
      );
    return this.dto(group, userId);
  }
  async leave(userId: string, groupId: string) {
    const group = await this.groups().findOne({
      _id: key(groupId),
      members: key(userId),
      active: true,
    });
    if (!group) return { left: true };
    if (String(group.ownerId) === userId)
      await this.groups().updateOne(
        { _id: group._id },
        { $set: { active: false, members: [], inviteHash: "" } },
      );
    else
      await this.groups().updateOne(
        { _id: group._id },
        { $pull: { members: key(userId) } },
      );
    return { left: true };
  }
  private async dto(group: Group, userId: string) {
    const users = await this.db
      .collection("users")
      .find({ _id: { $in: group.members } })
      .project({ firstName: 1, lastName: 1 })
      .toArray();
    // Rolling seven days is explicit; no private exercise logs or medical information are shared.
    const sessions = await this.db
      .collection("business_class_sessions")
      .find({
        classId: group.classId,
        startsAt: {
          $gte: new Date(Date.now() - 7 * 86400000),
          $lte: new Date(),
        },
        status: { $ne: "cancelled" },
      })
      .project({ _id: 1 })
      .toArray();
    const students = await this.db
      .collection("club_students")
      .find({ userId: { $in: group.members } })
      .project({ userId: 1 })
      .toArray();
    const records = await this.db
      .collection("business_class_attendance")
      .find({
        classId: group.classId,
        sessionId: { $in: sessions.map((s) => s._id) },
        studentId: { $in: students.map((s) => s._id) },
        status: "present",
      })
      .project({ studentId: 1, sessionId: 1 })
      .toArray();
    return {
      id: String(group._id),
      title: group.title,
      goal: group.goal,
      isOwner: String(group.ownerId) === userId,
      members: group.members.map((member) => {
        const user = users.find((u) => String(u._id) === String(member));
        const ids = students
          .filter((s) => String(s.userId) === String(member))
          .map((s) => String(s._id));
        return {
          name:
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            "ورزشکار",
          isMe: String(member) === userId,
          attendanceCount: new Set(
            records
              .filter((r) => ids.includes(String(r.studentId)))
              .map((r) => String(r.sessionId)),
          ).size,
        };
      }),
    };
  }
}
