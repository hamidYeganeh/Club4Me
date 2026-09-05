# راه‌اندازی integrationهای production

کد اتصال برای MongoDB، Redis، GCS export storage، کاوه‌نگار، Firebase/FCM،
Neshan و Sentry وجود دارد؛ فعال‌شدن واقعی آن‌ها نیازمند credential و endpoint
محیط production است و با قرار دادن secret داخل مخزن انجام نمی‌شود.

## وضعیت مشاهده‌شده در ۵ سپتامبر ۲۰۲۶

- `https://gym4me.ir/` پاسخ ۲۰۰ می‌دهد، اما مسیرهای `/privacy`، `/terms`،
  `/support` و `/account-deletion` هر چهار مورد پاسخ ۴۰۴ داشتند؛ build تازه
  website باید deploy شود.
- `https://api.gym4me.ir/health/ready` پاسخ ۴۰۴ داشت؛ routing یا نسخه deployشده
  backend هنوز health-check جدید را ارائه نمی‌کند.
- در محیط توسعه حاضر `adb` نصب/متصل نبود، بنابراین اجرای واقعی گوشی ثبت نشده
  است.

## backend

| سرویس          | تنظیمات لازم                                                                              | کنترل بعد از استقرار                            |
| -------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| MongoDB        | `MONGODB_URL` اختصاصی production، کاربر least-privilege، backup و TLS                     | `/health/ready` و restore آزمایشی backup        |
| Redis          | `REDIS_URL` اختصاصی، auth، TLS یا شبکه خصوصی و eviction policy مناسب session              | `/health/ready`، logout/refresh و restart       |
| Object Storage | `EXPORT_STORAGE_DRIVER=gcs` و `EXPORT_GCS_BUCKET`؛ service account با حداقل دسترسی object | تولید export، signed URL کوتاه‌عمر و expiry job |
| SMS            | `KAVENEGAR_API_KEY`، sender و templateهای تأییدشده                                        | OTP، reset و پیام رزرو روی شماره تست            |
| Firebase       | سه متغیر inline service account یا یک فایل secret mountشده                                | ثبت token و Push foreground/background/killed   |
| Sentry         | `SENTRY_DSN` و `APP_RELEASE` یکتا                                                         | رخداد کنترل‌شده بدون PII و با release صحیح      |

فایل media فعلی URL/data را ثبت می‌کند و upload مستقیم فایل به bucket ندارد؛
GCS موجود فقط exportهای عملیاتی را ذخیره می‌کند. اگر رسانه کاربر/باشگاه بخشی
از release است، signed upload، اعتبارسنجی محتوا، اسکن و lifecycle bucket یک
کار جداگانه و الزامی است.

## Android/web application

| سرویس    | تنظیمات build-time                                             |
| -------- | -------------------------------------------------------------- |
| API      | `NEXT_PUBLIC_API_URL=https://.../api/v1`                       |
| Neshan   | `NEXT_PUBLIC_NESHAN_MAP_KEY` محدودشده به دامنه/package مجاز    |
| Sentry   | `NEXT_PUBLIC_SENTRY_DSN` و `NEXT_PUBLIC_APP_RELEASE`           |
| Firebase | `google-services.json` متناظر با `com.gym4me.app` از secret CI |

چون متغیرهای `NEXT_PUBLIC_*` داخل artifact قرار می‌گیرند، تغییر آن‌ها نیازمند
build تازه است. release Android به‌صورت پیش‌فرض cleartext را رد می‌کند.

## ترتیب فعال‌سازی

1. Secretها را در secret manager محیط و GitHub Environment ثبت کنید.
2. migration/seed لازم را با backup و حساب محدود اجرا کنید.
3. backend را بالا آورده و live/ready را از load balancer کنترل کنید.
4. OTP، Push، نقشه، export و رخداد Sentry کنترل‌شده را smoke کنید.
5. AAB را با همان API و credentialهای client بسازید و Internal testing را اجرا
   کنید.
6. پس از چرخه واقعی رزرو/refund و ۲۴ ساعت مشاهده crash/error، rollout محدود را
   شروع کنید.

## مانع production مالی

provider پرداخت فعلی فقط `mock` است و endpoint تصمیم mock با نشست کاربر در کد
وجود دارد. پیش از rollout عمومی باید provider واقعی، verify سمت سرور، callback
امضاشده، idempotency، reconciliation و refund همان provider پیاده‌سازی و
endpointهای mock در production غیرفعال شوند.
