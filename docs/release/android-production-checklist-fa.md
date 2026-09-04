# چک‌لیست انتشار Android جیم فور می

## سرویس‌های بیرونی

- Firebase: اپ Android با package برابر `com.gym4me.application` بسازید و
  `google-services.json` را فقط در `apps/application/android/app/` قرار دهید.
- Firebase service account: سه مقدار `FIREBASE_PROJECT_ID`،
  `FIREBASE_CLIENT_EMAIL` و `FIREBASE_PRIVATE_KEY` را در Secretهای بک‌اند ثبت
  کنید؛ فایل JSON حساب سرویس را داخل مخزن نگذارید.
- Sentry: یک پروژه Browser و یک پروژه Node بسازید و DSNها را به‌ترتیب در
  `NEXT_PUBLIC_SENTRY_DSN` و `SENTRY_DSN` قرار دهید. DSN رمز محرمانه نیست، اما
  Auth Token مربوط به upload sourcemap باید فقط در CI باشد.

## انتشار

- Workflow با نام `Android release bundle` را با `version_name` و
  `version_code` اجرا کنید. Secretهای `ANDROID_KEYSTORE_BASE64`،
  `ANDROID_KEYSTORE_PASSWORD`، `ANDROID_KEY_ALIAS`، `ANDROID_KEY_PASSWORD` و
  `GOOGLE_SERVICES_JSON_BASE64` باید در environment تولید GitHub ثبت شده باشند.
- متغیر GitHub با نام `NEXT_PUBLIC_API_URL` را روی API عمومی HTTPS تنظیم کنید؛
  خروجی امضاشده به‌صورت artifact با پسوند AAB تحویل می‌شود.

- `NEXT_PUBLIC_API_URL` باید HTTPS عمومی production باشد.
- `NODE_ENV=production`، `TRUST_PROXY=true` (فقط پشت reverse proxy معتبر)،
  `JWT_SECRET` تصادفی و Redis/Mongo production تنظیم شوند.
- `GYM4ME_VERSION_CODE` در هر انتشار افزایش یابد و
  `GYM4ME_VERSION_NAME` با نسخه پنل انتشار برابر باشد.
- AAB روی Internal testing نصب و ورود، موقعیت، رزرو، Push، Deep Link، حالت
  آفلاین، حذف حساب و Force Update روی دستگاه واقعی آزمایش شوند.
- لینک‌های `https://gym4me.ir/privacy`، `/terms`، `/support` و
  `/account-deletion` قبل از ثبت Store Listing در دسترس عمومی باشند.
- فرم Data Safety مطابق داده‌های واقعی تکمیل شود: شماره موبایل، موقعیت، محتوای
  کاربر، شناسه دستگاه، تعاملات و داده‌های تشخیصی.
- ابتدا rollout محدود انجام شود؛ نرخ crash و پاسخ API بررسی و سپس rollout کامل
  شود.

## Deep Link معتبر HTTPS

طرح `gym4me://app/...` داخل اپ فعال است. برای Android App Links دامنه‌ای، بعد
از ساخت signing certificate فایل `.well-known/assetlinks.json` را با SHA-256
همان certificate روی دامنه منتشر و intent filter تأییدشده HTTPS اضافه کنید.
اثر انگشت certificate را نمی‌توان پیش از ساخت کلید انتشار به‌درستی تولید کرد.
