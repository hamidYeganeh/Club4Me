type Data = Record<string, unknown>;
const object = (value: unknown): Data =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Data)
    : {};
const text = (value: unknown): string =>
  typeof value === "string" && !/^[a-f\d]{24}$/i.test(value)
    ? value.trim()
    : "";
const statuses: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  published: "منتشرشده",
  draft: "پیش‌نویس",
  paused: "متوقف",
  scheduled: "برگزارنشده",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
  approved: "تأییدشده",
  pending: "در انتظار",
  pending_review: "در انتظار بررسی",
};
export function entityOptionDetails(value: unknown, fallbackTitle: string) {
  const item = object(value),
    user = object(item.user),
    athlete = object(item.athlete);
  const fullName = [text(item.firstName), text(item.lastName)]
    .filter(Boolean)
    .join(" ");
  const phone = text(item.phone) || text(user.phone) || text(athlete.phone);
  const person = Boolean(
    fullName ||
    item.displayName ||
    (phone && !item.address && !item.timezone && !item.ownerId),
  );
  const title = fullName || text(item.displayName) || fallbackTitle;
  const place = Boolean(
    item.address || item.ownerId || item.geo || (item.timezone && item.name),
  );
  const date =
    text(item.startsAt) ||
    text(item.startAt) ||
    (typeof item.version === "number" ? text(item.createdAt) : "");
  const kind = person
    ? "person"
    : place
      ? "place"
      : date ||
          item.courseStartAt ||
          item.coachAssignments ||
          item.enrollmentCount !== undefined
        ? "class"
        : item.sportCategoryId
          ? "sport"
          : "resource";
  const image =
    text(item.avatarUrl) ||
    text(user.avatarUrl) ||
    text(object(item.avatarMedia).url) ||
    text(item.imageUrl) ||
    text(object(item.coverMedia).url) ||
    text(item.coverImageUrl);
  const price =
    typeof item.price === "number" ? item.price : object(item.price).amount;
  const currency =
    text(item.currency) || text(object(item.price).currency) || "IRR";
  const currencyLabel =
    currency === "IRT" ? "تومان" : currency === "IRR" ? "ریال" : currency;
  const priceText =
    typeof price === "number"
      ? price === 0
        ? "رایگان"
        : `${price.toLocaleString("fa-IR")} ${currencyLabel}`
      : "";
  const parent = [
    "province",
    "city",
    "country",
    "category",
    "sport",
    "club",
    "branch",
    "trainingClass",
    "class",
  ]
    .map((key) => text(object(item[key]).name) || text(object(item[key]).title))
    .filter(Boolean);
  const coach =
    text(object(item.coach).displayName) ||
    text(object(item.ownerCoach).displayName) ||
    [
      text(object(item.coachProfile).firstName),
      text(object(item.coachProfile).lastName),
    ]
      .filter(Boolean)
      .join(" ");
  const dateText =
    date && !Number.isNaN(Date.parse(date))
      ? new Date(date).toLocaleString("fa-IR", {
          timeZone: "Asia/Tehran",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
  const capacity =
    typeof item.capacity === "number"
      ? `${item.capacity.toLocaleString("fa-IR")} نفر ظرفیت`
      : "";
  const details =
    person && phone
      ? [phone]
      : place
        ? [
            text(item.address) || text(object(item.address).text),
            ...parent,
            phone,
          ]
        : [
            dateText,
            coach,
            ...parent,
            priceText,
            capacity,
            text(item.description),
            text(item.specialty),
            statuses[String(item.status)] ?? "",
          ];
  const description = [
    ...new Set(details.filter((part) => part && part !== title)),
  ]
    .slice(0, 2)
    .join(" · ");
  return {
    title,
    description,
    phoneOnly: person && Boolean(phone),
    image,
    kind,
    initials: title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join(""),
  };
}
