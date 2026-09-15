import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  OnModuleInit,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { z } from "zod";
import { userFeatureWrite } from "../../lib/user-feature-write";
import { parse } from "../../lib/validate";
import { AppError } from "../../common/errors/app.exception";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";

export const habitSchema = z.object({
  title: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(20),
  target: z.number().positive().max(100000),
});
export const habitLogSchema = z.object({
  date: z.string().date(),
  value: z.number().min(0).max(100000),
});
type Habit = {
  _id: string;
  userId: Types.ObjectId;
  title: string;
  unit: string;
  target: number;
  archived: boolean;
  logs: { date: string; value: number; target: number }[];
};
const day = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
@Injectable()
export class HabitsService implements OnModuleInit {
  constructor(@InjectConnection() private readonly db: Connection) {}
  private get rows() {
    return this.db.collection<Habit>("training_habits");
  }
  async onModuleInit() {
    await this.rows.createIndex({ userId: 1, archived: 1 });
  }
  private key(userId: string, id: string) {
    return `${userId}:${parse(z.string().uuid(), id)}`;
  }
  async list(userId: string) {
    const items = await this.rows
      .find({ userId: new Types.ObjectId(userId), archived: false })
      .limit(20)
      .toArray();
    return {
      today: day(new Date()),
      items: items.map((item) => ({
        id: item._id.split(":")[1],
        title: item.title,
        unit: item.unit,
        target: item.target,
        logs: item.logs,
      })),
    };
  }
  async save(userId: string, id: string, body: unknown) {
    const input = parse(habitSchema, body),
      _id = this.key(userId, id),
      owner = new Types.ObjectId(userId);
    await userFeatureWrite(this.db, userId, "habits", async (session) => {
      const existing = await this.rows.findOne(
        { _id, archived: false },
        { session },
      );
      if (
        !existing &&
        (await this.rows.countDocuments(
          { userId: owner, archived: false },
          { session },
        )) >= 20
      )
        throw new AppError(
          400,
          "HABIT_LIMIT",
          "حداکثر ۲۰ عادت فعال نگه دارید.",
        );
      await this.rows.updateOne(
        { _id },
        {
          $set: { ...input, userId: owner, archived: false },
          $setOnInsert: { logs: [] },
        },
        { upsert: true, session },
      );
    });
    return { id };
  }
  async log(userId: string, id: string, body: unknown) {
    const input = parse(habitLogSchema, body),
      _id = this.key(userId, id);
    if (
      input.date > day(new Date()) ||
      input.date < day(new Date(Date.now() - 28 * 86400000))
    )
      throw new AppError(
        400,
        "INVALID_HABIT_DATE",
        "ثبت عادت فقط برای امروز و ۲۸ روز گذشته ممکن است.",
      );
    const result = await this.rows.updateOne({ _id, archived: false }, [
      {
        $set: {
          logs: {
            $slice: [
              {
                $concatArrays: [
                  {
                    $filter: {
                      input: "$logs",
                      as: "log",
                      cond: { $ne: ["$$log.date", input.date] },
                    },
                  },
                  [{ date: input.date, value: input.value, target: "$target" }],
                ],
              },
              -29,
            ],
          },
        },
      },
    ]);
    if (!result.matchedCount)
      throw new AppError(404, "HABIT_NOT_FOUND", "عادت پیدا نشد.");
    return { success: true };
  }
  async archive(userId: string, id: string) {
    await this.rows.updateOne(
      { _id: this.key(userId, id) },
      { $set: { archived: true } },
    );
    return { success: true };
  }
}
@Controller("api/v1/training/habits")
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly service: HabitsService) {}
  @Get() list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.list(user.sub);
  }
  @Put(":id") save(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.service.save(user.sub, id, body);
  }
  @Put(":id/log") log(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.service.log(user.sub, id, body);
  }
  @Delete(":id") archive(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.service.archive(user.sub, id);
  }
}
