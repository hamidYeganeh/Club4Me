"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";

const pages: Record<string, [string, string, string]> = {
  "/": [
    "داشبورد",
    "همراه کسب‌وکار ورزشی شما",
    "عملکرد باشگاه و کارهای امروز را یک‌جا دنبال کنید.",
  ],
  clubs: [
    "باشگاه‌ها",
    "خانهٔ ورزش را مدیریت کنید",
    "اطلاعات باشگاه، امکانات و خدمات قابل رزرو.",
  ],
  students: [
    "شاگردها",
    "ارتباط نزدیک‌تر با اعضا",
    "پروفایل، وضعیت عضویت و اطلاعات شاگردها.",
  ],
  coaches: [
    "مربی‌ها",
    "تیم حرفه‌ای باشگاه شما",
    "اطلاعات مربی‌ها و همکاری با تیم باشگاه.",
  ],
  classes: [
    "کلاس‌ها",
    "برنامه‌ای برای هر ورزشکار",
    "کلاس‌ها، ظرفیت و برنامهٔ جلسات را مدیریت کنید.",
  ],
  calendar: [
    "تقویم",
    "برنامهٔ باشگاه در یک نگاه",
    "کلاس‌ها، سانس‌ها و رزروهای هر روز را یک‌جا ببینید.",
  ],
  payments: [
    "پرداخت‌ها",
    "حساب‌ها، روشن و مرتب",
    "رسیدها، پرداخت اعضا و وضعیت تسویه را بررسی کنید.",
  ],
  memberships: [
    "بسته‌ها و عضویت",
    "انتخاب‌های متنوع برای اعضا",
    "بسته‌ها و اعتبارهای قابل استفاده در باشگاه.",
  ],
  reviews: [
    "نظرها",
    "تجربهٔ اعضا را بشنوید",
    "بازخوردها را بخوانید و پاسخ مناسب بدهید.",
  ],
  attendance: [
    "حضور‌وغیاب",
    "هر جلسه را دقیق ثبت کنید",
    "حضور شاگردها و سابقهٔ شرکت در جلسات.",
  ],
  "check-in": [
    "ورود و پذیرش",
    "پذیرش سریع و دقیق اعضا",
    "اعتبار، رزرو و ورود اعضا را در یک نما بررسی کنید.",
  ],
  reception: [
    "ورود و پذیرش",
    "پذیرش سریع و دقیق اعضا",
    "اعتبار، رزرو و ورود اعضا را در یک نما بررسی کنید.",
  ],
  branches: [
    "شعبه‌ها",
    "یک تیم، در چند شعبه",
    "اطلاعات و راه‌های ارتباطی شعبه‌ها.",
  ],
  data: [
    "داده‌ها",
    "گزارش‌های باشگاه در دسترس",
    "ورود و خروج اطلاعات و گزارش‌های کاری.",
  ],
  settings: ["تنظیمات", "حساب شما", "اطلاعات و تنظیمات حساب کاربری."],
};
export function businessPageTitle(path: string) {
  if (path.endsWith("/reservations")) return "مدیریت رزرو";
  if (path === "/clubs/new") return "ساخت باشگاه";
  if (path === "/classes/new") return "ساخت کلاس";
  if (path.endsWith("/edit")) return "ویرایش کلاس";
  if (/^\/clubs\/[^/]+$/.test(path)) return "اطلاعات باشگاه";
  if (path.includes("/classes/")) return "جزئیات کلاس";
  return (pages[path.split("/")[1] || "/"] ?? pages["/"])![0];
}
export function BusinessPageIntro() {
  const path = usePathname();
  const [label, title, description] = (pages[path.split("/")[1] || "/"] ??
    pages["/"])!;
  // Operations and forms have a compact introduction; photo heroes belong to overview pages.
  if (
    path.split("/").filter(Boolean).length > 1 ||
    [
      "settings",
      "data",
      "coach",
      "attendance",
      "calendar",
      "check-in",
      "reception",
    ].includes(path.slice(1))
  )
    return null;
  return (
    <section className="business-photo-hero" aria-label={title}>
      <Image
        src="/design/cover.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover"
      />
      <div className="business-hero-scrim" aria-hidden>
        {[false, true].map((top) => (
          <div
            key={String(top)}
            className={`business-blur-edge ${top ? "is-top" : ""}`}
          >
            {[2, 4, 8, 16].map((blur, i) => (
              <span
                key={blur}
                style={{
                  backdropFilter: `blur(${blur}px)`,
                  height: `${100 - i * 20}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="relative z-10 mt-auto p-5 sm:p-7">
        <span className="inline-flex rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
          {label}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-10 text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-white/90">{description}</p>
      </div>
    </section>
  );
}
