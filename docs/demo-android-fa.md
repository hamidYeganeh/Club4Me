# راهنمای دمو و انتشار اندروید Gym4Me

این نسخه برای نمایش کامل مسیرهای ورزشکار، مربی و باشگاه آماده شده است. APK دمو به‌صورت debug امضا شده و روی شبیه‌ساز اندروید به API محلی در `10.0.2.2:7088` وصل می‌شود.

## اجرای دموی محلی

پیش‌نیازها: Node.js 24 یا جدیدتر، MongoDB، Redis و Android 7 یا جدیدتر.

```sh
npm install
cp apps/backend/.env.example apps/backend/.env
npm run seed:demo --workspace=backend
npm run dev --workspace=backend
```

برای پنل‌های وب در ترمینال‌های جداگانه:

```sh
npm run dev --workspace=application
npm run dev --workspace=business
npm run dev --workspace=admin
```

- اپ ورزشکار/مربی: `http://localhost:7081`
- پنل باشگاه: `http://localhost:7083`
- پنل ادمین: `http://localhost:7082`
- API: `http://localhost:7088`

سپس APK را روی شبیه‌ساز نصب کنید:

```sh
adb install -r apps/application/android/app/build/outputs/apk/debug/app-debug.apk
```

برای بازسازی کامل APK دمو:

```sh
npm run cap:apk --workspace=application
```

## حساب‌های دمو

رمز همهٔ حساب‌ها `Demo@1405` است.

| نقش | شماره موبایل | کاربرد |
| --- | --- | --- |
| ورزشکار اصلی | `09120000001` | رزرو باشگاه، مربی و کلاس؛ پرداخت و لغو |
| ورزشکار ثبت‌نام‌شده | `09120000002` | نمایش شاگرد و حضور و غیاب |
| مربی | `09120000003` | مدیریت کلاس، شاگرد، رزرو و حضور و غیاب |
| مالک باشگاه | `09120000004` | مدیریت باشگاه و رزروهای مجموعه |
| ادمین | `09120000005` | تأیید و مدیریت سراسری |

دادهٔ seed ثابت و idempotent است. مقصدهای اصلی دمو:

- باشگاه: `66d400000000000000000001`
- مربی: `66d500000000000000000001`
- کلاس: `66d500000000000000000004`

## سناریوی پیشنهادی دمو

1. با ورزشکار اصلی وارد شوید و از اکتشاف، باشگاه یا مربی یا کلاس را باز کنید.
2. سانس را انتخاب و رزرو را ایجاد کنید.
3. در درگاه ماک فقط یکی از دو دکمهٔ «تأیید پرداخت» یا «رد پرداخت» را بزنید؛ نتیجه در وضعیت رزرو و اعلان‌ها دیده می‌شود.
4. با حساب مربی وارد «رزروها» شوید؛ درخواست‌ها، شاگردان کلاس و حضور و غیاب را مدیریت کنید.
5. با حساب مالک در پنل باشگاه و با حساب ادمین در پنل مدیریت، همان چرخه را از سمت عملیات بررسی کنید.

## پیامک کاوه‌نگار

نام templateهای فایل الگو در `apps/backend/.env.example` تنظیم شده‌اند:

| رویداد | template |
| --- | --- |
| کد ورود/بازیابی | `gym4meotp` |
| تأیید رزرو | `gym4mebookingconfirmed` |
| یادآوری رزرو | `gym4mebookingreminder` |
| لغو رزرو | `gym4mebookingcancelled` |
| جابه‌جایی رزرو | `gym4mebookingrescheduled` |
| پرداخت ناموفق | `gym4mepaymentfailed` |
| لیست انتظار | `gym4mewaitlist` |
| تأیید مالک باشگاه | `gym4meownerapproved` |

برای ارسال واقعی فقط `KAVENEGAR_API_KEY` را در `apps/backend/.env` قرار دهید. نبود کلید در development مانع رزرو و دمو نمی‌شود. مقدارهای حساس را commit نکنید.

## نقشه و گوشی واقعی

- برای نقشه، `NEXT_PUBLIC_NESHAN_MAP_KEY` را در `apps/application/.env.local` تنظیم کنید.
- APK آماده برای شبیه‌ساز ساخته شده است. گوشی واقعی باید به یک API عمومی HTTPS دسترسی داشته باشد؛ پیش از build مقدار `NEXT_PUBLIC_API_URL=https://.../api/v1` را تنظیم کنید.
- نسخهٔ release فقط HTTPS را می‌پذیرد. cleartext صرفاً در manifest نوع debug و فقط برای loopback شبیه‌ساز مجاز است.

## خروجی قابل انتشار

برای انتشار، ابتدا `google-services.json` را برای Push Notification در `apps/application/android/app/` بگذارید و متغیرهای زیر را فقط در محیط CI یا shell امن تعریف کنید:

```sh
export GYM4ME_ANDROID_KEYSTORE=/absolute/path/to/release.jks
export GYM4ME_ANDROID_KEYSTORE_PASSWORD=...
export GYM4ME_ANDROID_KEY_ALIAS=...
export GYM4ME_ANDROID_KEY_PASSWORD=...
```

نسخه و build number را هنگام ساخت مشخص و AAB امضاشده تولید کنید:

```sh
npm run cap:sync --workspace=application
cd apps/application/android
./gradlew :app:bundleRelease -PGYM4ME_VERSION_CODE=2 -PGYM4ME_VERSION_NAME=1.0.1
```

اگر signing تنظیم نشده باشد، build نوع release عمداً با پیام روشن متوقف می‌شود. کلیدهای Firebase، کاوه‌نگار، نشان، Sentry و URL نهایی API اطلاعات استقرار هستند و داخل مخزن قرار نمی‌گیرند.

## کنترل کیفیت اجراشده

```sh
npm run check-types
npm run lint
npm test --workspace=backend -- --runInBand
npm run build
```

مسیرهای رزرو باشگاه، رزرو مستقیم مربی، ثبت‌نام کلاس، پرداخت موفق/ناموفق، لغو و بازپرداخت، مدیریت شاگرد، حضور و غیاب، اعلان درون‌اپ و پیامک templateدار دارای تست هستند.
