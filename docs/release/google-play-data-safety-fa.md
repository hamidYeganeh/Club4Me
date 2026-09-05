# پاسخ‌نامه Data Safety برای Google Play

این سند پاسخ‌نامه اجرایی برای پکیج Android با شناسه `com.gym4me.app` است و بر
اساس کد نسخه ۱۴ شهریور ۱۴۰۵ تهیه شده است. پیش از هر ارسال جدید، dependencyها،
رفتار SDKها و سرویس‌های واقعاً فعال در build نهایی دوباره بررسی شوند.

## پاسخ‌های سراسری پیشنهادی

| پرسش Play Console                    | پاسخ پیشنهادی | شرط پذیرش                                                                                                                                                          |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| آیا اپ داده کاربر جمع‌آوری می‌کند؟   | بله           | داده از دستگاه به API، FCM، نشان یا Sentry فرستاده می‌شود.                                                                                                         |
| آیا داده رمزنگاری‌شده منتقل می‌شود؟  | بله           | `NEXT_PUBLIC_API_URL` حتماً HTTPS باشد و release فقط گواهی معتبر سیستم را بپذیرد.                                                                                  |
| آیا کاربر می‌تواند درخواست حذف بدهد؟ | بله           | مسیر داخل اپ و `https://gym4me.ir/account-deletion` هر دو فعال و قابل دسترس باشند.                                                                                 |
| آیا داده با شخص ثالث share می‌شود؟   | مشروطاً «خیر» | فقط وقتی قرارداد همه پردازشگرها استفاده مستقل از داده را منع کند و آن‌ها ذیل استثنای service provider فرم باشند؛ در غیر این صورت برای همان نوع داده «بله» ثبت شود. |

## انواع داده‌ای که باید اعلام شوند

| دسته و نوع داده در Play                     | جمع‌آوری                    | اجباری/اختیاری        | هدف پیشنهادی                                            | محل/شاهد در محصول                               |
| ------------------------------------------- | --------------------------- | --------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| Location / Approximate location             | بله                         | اختیاری               | App functionality                                       | اجازه مکان و جست‌وجوی خدمات نزدیک               |
| Location / Precise location                 | بله                         | اختیاری               | App functionality                                       | `ACCESS_FINE_LOCATION` و مختصات مکان ذخیره‌شده  |
| Personal info / Name                        | بله                         | اختیاری               | Account management, App functionality                   | پروفایل کاربر                                   |
| Personal info / Phone number                | بله                         | اجباری برای حساب      | Account management, App functionality, Fraud prevention | ورود OTP/رمز و پیامک عملیاتی                    |
| Personal info / User IDs                    | بله                         | اجباری                | Account management, App functionality, Analytics        | شناسه داخلی حساب                                |
| Personal info / Address                     | بله                         | اختیاری               | App functionality                                       | مکان‌های ذخیره‌شده کاربر                        |
| Personal info / Other info                  | بله                         | اختیاری               | Account management                                      | تاریخ تولد اختیاری پروفایل                      |
| Financial info / Purchase history           | بله                         | هنگام خرید            | App functionality, Fraud prevention                     | رزرو، مبلغ، تخفیف، کیف پول و refund             |
| App activity / App interactions             | بله                         | هنگام استفاده با حساب | Analytics, App functionality                            | قیف کشف، رزرو، پرداخت و تغییر تنظیمات           |
| App activity / Other user-generated content | بله                         | اختیاری               | App functionality                                       | نظر، امتیاز و متن تیکت پشتیبانی                 |
| App info and performance / Crash logs       | در build دارای Sentry: بله  | خودکار هنگام خطا      | Analytics                                               | Sentry بدون `sendDefaultPii`                    |
| App info and performance / Diagnostics      | در build دارای Sentry: بله  | خودکار                | Analytics, Fraud prevention                             | نسخه اپ، محیط، خطا و اطلاعات فنی محدود          |
| Device or other IDs / Device or other IDs   | در صورت فعال بودن Push: بله | اختیاری               | App functionality                                       | شناسه دستگاه، Firebase installation و FCM token |

## مواردی که در build فعلی جمع‌آوری نمی‌شوند

- اطلاعات کارت بانکی، CVV2 یا رمز: در مدل‌ها ذخیره نمی‌شود؛ درگاه واقعی نیز
  هنوز به پروژه متصل نشده است.
- مخاطبان، فایل‌های دستگاه، SMS، صدا و سلامت/fitness biometrics.
- Advertising ID و داده تبلیغاتی: SDK تبلیغاتی در dependencyهای اپ دیده نشد.
- عکس و ویدئوی کاربر در مسیر Android فعلی ارسال نمی‌شود. اگر upload نظر یا
  پروفایل در release فعال شد، این دو نوع باید قبل از انتشار به فرم اضافه شوند.

## حذف و نگهداری

- حذف داخل اپ نشست‌ها را باطل، شماره موبایل را با شناسه غیرقابل استفاده جایگزین
  و نام، تاریخ تولد، رمز، مکان‌ها، علاقه‌مندی‌ها، نظرها، اعلان‌ها و device tokenها
  را حذف می‌کند.
- رکوردهای محدود رزرو/پرداخت ممکن است با شناسه ناشناس برای حسابداری، حل اختلاف
  یا مقابله با تقلب باقی بمانند. این استثنا باید در Privacy و پاسخ Data deletion
  عیناً هم‌راستا باشد.
- داده تحلیل محصول TTL برابر ۱۸۰ روز دارد.

## کنترل نهایی پیش از Submit

- [ ] Privacy URL و Account deletion URL بدون ورود و با HTTPS باز می‌شوند.
- [ ] نام ناشر، ایمیل تماس و نام اپ با Store Listing یکسان است.
- [ ] dependencyهای AAB با `./gradlew :app:dependencies` دوباره بررسی شده‌اند.
- [ ] رفتار نسخه نصب‌شده با پاسخ‌های بالا روی حساب تازه کنترل شده است.
- [ ] قرارداد/شرایط پردازش داده Firebase، Sentry، نشان، کاوه‌نگار، میزبان و درگاه
      برای پاسخ «Data shared» توسط مسئول حقوقی تأیید شده است.
- [ ] اسکرین‌شات پاسخ نهایی و تاریخ آن کنار artifact همان release نگهداری شده است.
