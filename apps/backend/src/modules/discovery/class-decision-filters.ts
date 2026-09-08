import { AppError } from "../../common/errors/app.exception";
import { DELIVERY_MODES } from "../coaching/coaching.constants";
import { Types } from "mongoose";

export function classDecisionFilters(
  query: Record<string, string | undefined>,
  business = false,
) {
  const filter: Record<string, unknown> = {};
  const price: Record<string, number> = {};
  for (const [key, operator] of [
    ["minPrice", "$gte"],
    ["maxPrice", "$lte"],
  ] as const) {
    if (query[key] === undefined) continue;
    const value = Number(query[key]);
    if (!query[key]?.trim() || !Number.isSafeInteger(value) || value < 0)
      throw new AppError(
        400,
        "INVALID_PRICE_FILTER",
        "بودجه باید مبلغ صحیح و نامنفی به ریال باشد.",
      );
    price[operator] = value;
  }
  if (
    price.$gte !== undefined &&
    price.$lte !== undefined &&
    price.$gte > price.$lte
  )
    throw new AppError(
      400,
      "INVALID_PRICE_FILTER",
      "حداقل بودجه از حداکثر بیشتر است.",
    );
  if (Object.keys(price).length) {
    filter[business ? "price" : "price.amount"] = price;
    filter[business ? "currency" : "price.currency"] = "IRR";
  }
  if (query.serviceMode) {
    if (!(DELIVERY_MODES as readonly string[]).includes(query.serviceMode))
      throw new AppError(
        400,
        "INVALID_SERVICE_MODE",
        "شیوه برگزاری معتبر نیست.",
      );
    if (business) {
      if (query.serviceMode !== "club") filter._id = { $in: [] };
    } else filter.deliveryMode = query.serviceMode;
  }
  if (query.admission) {
    if (!["automatic", "requires_approval"].includes(query.admission))
      throw new AppError(
        400,
        "INVALID_ADMISSION_FILTER",
        "نوع پذیرش معتبر نیست.",
      );
    filter.enrollmentMode = query.admission;
  }
  if (query.skillLevelId) {
    if (!Types.ObjectId.isValid(query.skillLevelId))
      throw new AppError(400, "INVALID_SKILL_LEVEL", "سطح کلاس معتبر نیست.");
    const skillLevelId = new Types.ObjectId(query.skillLevelId);
    if (business && query.legacyLevel?.trim()) {
      const escaped = query.legacyLevel
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ی/g, "[یيى]")
        .replace(/ک/g, "[کك]");
      filter.$and = [
        {
          $or: [
            { skillLevelId },
            { skillLevelId: null, level: new RegExp(`^${escaped}$`, "i") },
            {
              skillLevelId: { $exists: false },
              level: new RegExp(`^${escaped}$`, "i"),
            },
          ],
        },
      ];
    } else filter.skillLevelId = skillLevelId;
  }
  const dates: Record<string, Date> = {};
  for (const [key, operator, suffix] of [
    ["startsFrom", "$gte", "T00:00:00.000Z"],
    ["startsTo", "$lte", "T23:59:59.999Z"],
  ] as const) {
    if (query[key] === undefined) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query[key]!))
      throw new AppError(400, "INVALID_DATE_FILTER", "تاریخ شروع معتبر نیست.");
    const value = new Date(`${query[key]}${suffix}`);
    if (Number.isNaN(value.getTime()))
      throw new AppError(400, "INVALID_DATE_FILTER", "تاریخ شروع معتبر نیست.");
    dates[operator] = value;
  }
  if (dates.$gte && dates.$lte && dates.$gte > dates.$lte)
    throw new AppError(
      400,
      "INVALID_DATE_FILTER",
      "ابتدای بازه زمانی از انتهای آن بیشتر است.",
    );
  if (Object.keys(dates).length)
    filter[business ? "startDate" : "courseStartAt"] = dates;
  const time = classTimeFilter(query);
  if (business && time) filter.schedule = { $elemMatch: { startTime: time } };
  return filter;
}

export function classTimeFilter(query: Record<string, string | undefined>) {
  const from = query.timeFrom;
  const to = query.timeTo;
  if (!from && !to) return undefined;
  const valid = (value?: string) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!valid(from) || !valid(to) || (from && to && from > to)) {
    throw new AppError(400, "INVALID_TIME_FILTER", "بازه ساعت کلاس معتبر نیست.");
  }
  return {
    ...(from ? { $gte: from } : {}),
    ...(to ? { $lte: to } : {}),
  };
}
