import { classDecisionFilters } from "./class-decision-filters";
import { Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";

type Query = Record<string, string | undefined>;

export function businessClassCatalogQuery(query: Query) {
  const number = (
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
    integer = false,
  ) => {
    const parsed = value === undefined ? fallback : Number(value);
    if (
      value === "" ||
      !Number.isFinite(parsed) ||
      parsed < min ||
      parsed > max ||
      (integer && !Number.isInteger(parsed))
    )
      throw new AppError(
        400,
        "INVALID_CATALOG_QUERY",
        "Invalid catalog query value",
      );
    return parsed;
  };
  const page = number(query.page, 1, 1, 100_000, true);
  const limit = number(query.limit, 20, 1, 100, true);
  const clubFilter: Record<string, unknown> = {
    reviewStatus: "approved",
    visibility: "public",
    operationalStatus: { $ne: "permanently_closed" },
    qualityStatus: { $ne: "suspended" },
  };
  for (const [parameter, field] of [
    ["clubId", "_id"],
    ["cityId", "geo.cityId"],
    ["districtId", "geo.districtId"],
    ["cityRegionId", "geo.cityRegionIds"],
  ]) {
    const value = query[parameter!];
    if (!value) continue;
    if (!Types.ObjectId.isValid(value))
      throw new AppError(
        400,
        "INVALID_CATALOG_QUERY",
        "Invalid location identifier",
      );
    clubFilter[field!] = new Types.ObjectId(value);
  }
  if (query.latitude !== undefined || query.longitude !== undefined) {
    if (query.latitude === undefined || query.longitude === undefined)
      throw new AppError(
        400,
        "INVALID_COORDINATES",
        "Both coordinates are required",
      );
    const latitude = number(query.latitude, 0, -90, 90);
    const longitude = number(query.longitude, 0, -180, 180);
    const radiusKm = number(query.radiusKm, 25, 0.1, 500);
    clubFilter.location = {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], (radiusKm * 1000) / 6378137],
      },
    };
  }
  const filter: Record<string, unknown> = {
    ...classDecisionFilters(query, true),
    status: "active",
    visibility: "public",
    endDate: { $gte: new Date(new Date().toISOString().slice(0, 10)) },
  };
  if (query.q?.trim()) {
    if (query.q.length > 200)
      throw new AppError(
        400,
        "INVALID_SEARCH",
        "Search is limited to 200 characters",
      );
    const normalized = query.q
      .trim()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/\s+/g, " ");
    const escaped = normalized
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/ی/g, "[یيى]")
      .replace(/ک/g, "[کك]")
      .replace(/ /g, "[\\s‌]+");
    const pattern = new RegExp(escaped, "i");
    filter.$or = ["title", "description", "sport", "level"].map((field) => ({
      [field]: pattern,
    }));
  }
  const sort: Record<string, 1 | -1> =
    query.sort === "newest"
      ? { createdAt: -1, _id: 1 }
      : { startDate: 1, _id: 1 };
  return { page, limit, skip: (page - 1) * limit, clubFilter, filter, sort };
}
