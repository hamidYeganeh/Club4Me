import { Card, Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

const insightCopy = {
  club: [
    ["محبوب بین ورزشکاران", "اعضا این باشگاه را پیشنهاد می‌کنند", "thumbs-up"],
    ["پاسخ‌گویی مناسب", "تجربه ارتباط با باشگاه رضایت‌بخش بوده", "chat-smile"],
    ["امکانات مطلوب", "کیفیت تجهیزات و فضای تمرین مثبت ارزیابی شده", "medal"],
  ],
  coach: [
    ["بسیار پیشنهادشده", "ورزشکاران این مربی را پیشنهاد می‌کنند", "thumbs-up"],
    ["وقت‌شناسی عالی", "جلسه‌ها منظم و به‌موقع برگزار می‌شوند", "clock"],
    ["رفتار حرفه‌ای", "نحوه آموزش و همراهی مربی رضایت‌بخش است", "medal"],
  ],
  class: [
    ["کلاس پیشنهادی", "شرکت‌کنندگان این کلاس را پیشنهاد می‌کنند", "thumbs-up"],
    ["برنامه‌ریزی منظم", "زمان‌بندی و روند برگزاری مطلوب است", "calendar-check"],
    ["تجربه یادگیری خوب", "محتوا و فضای کلاس رضایت‌بخش بوده", "smile-happy"],
  ],
} satisfies Record<string, Array<[string, string, IconName]>>;

export function ReviewSummary({
  type,
  average,
  count,
  distribution,
}: {
  type: "club" | "coach" | "class";
  average: number;
  count: number;
  distribution: number[];
}) {
  const max = Math.max(...distribution, 1);
  return (
    <Card className="app-card app-reveal overflow-hidden p-5 shadow-none">
      <div className="flex items-center gap-6">
        <div className="w-24 shrink-0 text-center">
          <Typography type="h1" weight="bold" className="leading-none tabular-nums">
            {average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </Typography>
          <p className="mt-2 text-sm font-bold text-foreground">میانگین امتیاز</p>
          <p className="mt-1 text-xs text-muted">{count.toLocaleString("fa-IR")} نظر</p>
        </div>
        <div className="min-w-0 flex-1 space-y-2" dir="ltr">
          {distribution.map((value, index) => {
            const rating = 5 - index;
            return (
              <div key={rating} className="grid grid-cols-[12px_18px_1fr_26px] items-center gap-2">
                <span className="text-xs font-bold tabular-nums">{rating}</span>
                <Icon name="star-full" size={14} className="text-accent" />
                <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(value / max) * 100}%` }} />
                </div>
                <span className="text-end text-xs tabular-nums text-muted">{value.toLocaleString("fa-IR")}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 divide-y divide-white/7">
        {insightCopy[type].map(([title, description, icon], index) => (
          <div key={title} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Icon name={icon} size={22} />
            </span>
            <div>
              <p className="text-sm font-black text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-6 text-muted">
                {count ? `${Math.max(72, 96 - index * 7).toLocaleString("fa-IR")}٪ · ` : ""}{description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
