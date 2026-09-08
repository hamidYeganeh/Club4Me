# بررسی محصول Club4Me و مسیر رقابت در ایران

> این سند مبنای پیش از اصلاح است؛ [وضعیت اجرای هر نیازمندی](./implementation-status-fa.md) را برای نتیجه فعلی ببینید.

تاریخ: ۶ سپتامبر ۲۰۲۶ — مبنا: کد موجود در همین checkout، قراردادهای API و صفحات رسمی رقبا.

**نتیجه اصلی:** پروژه زیرساخت یک پلتفرم ورزشی چندطرفه را دارد، اما توسعه عرضی از کامل‌شدن برخی مسیرهای اصلی جلو زده است. اولویت پیشنهادی، رساندن «پیداکردن گزینه مناسب → پرداخت قابل اعتماد → حضور → تمدید» به یک تجربه یکپارچه است. اضافه‌کردن تعداد بیشتری صفحه به‌تنهایی مزیت رقابتی ایجاد نمی‌کند.

## دامنه و اعتبار بررسی

- فهرست ۱۳۲ فایل مسیر صفحه تهیه شد: اپ کاربر/مربی ۷۷، پنل باشگاه ۲۵، ادمین ۲۵، وب‌سایت ۵. این اعداد تعداد مسیرهای کد هستند؛ مسیرهای پویا و صفحات مشابه به معنی تجربه مستقل نیستند.
- مدل‌ها، DTOها، کلاینت مشترک API، فرم‌ها و کامپوننت‌های مسیرهای اصلی به‌صورت هدفمند بررسی شدند. فهرست کامل مسیرها در فایل همراه است.
- ناسازگاری فرم دسترسی مربی با اجرای schema واقعی بک‌اند بازتولید شد. سایر موارد با دنبال‌کردن کد و نگاشت داده گزارش شده‌اند.
- این گزارش تست تصویری همه صفحات، تست کاربری، تست بار، ممیزی جامع امنیت یا تأیید محیط production نیست. اپ روی گوشی اجرا نشده و داده واقعی کاربران، نرخ تبدیل و درآمد در دسترس نبوده است.
- در طول بررسی، تغییرات هم‌زمان دیگری در checkout ایجاد شد. نسخه تازه فهرست کلاس‌ها اکنون جست‌وجوی محلی هر دو منبع، pagination کلاس مربی و نمایش خطای جدا دارد؛ ایراد گزارش‌شده جست‌وجوی عمومی `/discovery/search` همچنان مستقل از آن است. نیازمندی‌های کیفیتی، موارد انجام‌شده را هم به‌عنوان معیار حفظ رفتار درست در بر می‌گیرند.
- ادعاهای رقبا از صفحات عمومی خودشان است؛ کیفیت اجرای آن‌ها، سهم بازار و تعداد مشتریان مستقل را تأیید نمی‌کند.
- اسناد قدیمی فقط راهنما بودند. برای مثال سند integration هنوز upload رسانه را غایب معرفی می‌کند، اما کد فعلی upload فایل و storage محلی دارد. reconciliation خودکار، زیرساخت آفلاین، QR و export هم نباید دوباره به‌عنوان قابلیت کاملاً غایب پیشنهاد شوند. [E20](#e20) [E23](#e23)

## ۱. جایگاه پیشنهادی محصول

پیشنهاد من برای شروع: **ابزار پیدا کردن کلاس و باشگاه محلی مناسب، با ظرفیت و هزینه روشن، متصل به پذیرش و تمدید واقعی باشگاه.**

برای پایلوت، یک شهر و چند محله با یک یا دو دسته ورزشی منتخب را هدف بگیر؛ مثلاً کلاس‌های گروهی بدنسازی و تناسب اندام. انتخاب دقیق محله و رشته باید با توان جذب عرضه شما تعیین شود. این یک فرضیه شروع است، نه نتیجه تحقیق میدانی.

ارزش برای ورزشکار: «بدانم کدام گزینه به محله، بودجه، ساعت و شرایط من می‌خورد؛ رزرو کنم و در مراجعه غافلگیر نشوم.» ارزش برای باشگاه: «مشتری جدید بگیرم، ظرفیت و حضور را کنترل کنم و تمدیدها را از دست ندهم.» ارزش برای مربی: «خدمت روشن بفروشم و شاگرد و برنامه‌ام را در همان سیستم مدیریت کنم.»

### مقایسه محدود با بازار

| دسته | شاهد عمومی | نتیجه برای Club4Me |
| --- | --- | --- |
| کشف، رزرو زمین و کلاس | الوپلی شهر، رشته، منطقه، باشگاه، رزرو و پروفایل مربی را عرضه می‌کند. [صفحه رسمی](https://aloplay.io/fa) | فهرست باشگاه و دکمه رزرو به‌تنهایی تمایز نیست؛ دقت موجودی، کیفیت اطلاعات و تجربه مراجعه اهمیت دارد. |
| برنامه تمرین و همراهی مربی | فیتامین برنامه اختصاصی، ارتباط با مربی، ویدئوی حرکات و گزارش فعالیت را معرفی می‌کند. [صفحه رسمی](https://fitamin.ir/) | اگر وعده «پیشرفت ورزشی» می‌دهی، فقط بیوگرافی مربی و رزرو جلسه کافی نیست. |
| ابزار کار مربی | ایران بدن طراحی برنامه تمرینی/غذایی و ارائه برنامه به شاگرد را معرفی می‌کند. [صفحه رسمی](https://app.iranbadan.com/fa/) | ابزار قابل استفاده روزانه مربی می‌تواند عامل ماندگاری باشد؛ چت نمایشی جای آن را نمی‌گیرد. |
| مدیریت باشگاه | جیمونا عضویت، تراکنش، حضور، ورود QR و گزارش مدیریتی را عرضه می‌کند. [صفحه رسمی](https://gymona.ir/) | پنل باشگاه باید در پذیرش، شهریه و تمدید قابل اتکا باشد؛ صرفاً CRUD شاگردها کافی نیست. |

برداشت راهبردی: مسیر مناسب، تمرکز روی کیفیت چرخه محلی و بازگشت مشتری است. در این مرحله ساخت هم‌زمان یک رقیب کامل برای همه دسته‌های بالا، تیم را پراکنده می‌کند.

## ۲. سرمایه موجود پروژه

این قابلیت‌ها در کد وجود دارند؛ تکمیل و یکپارچه‌سازی آن‌ها از ساخت مجدد ارزشمندتر است:

- ورود با موبایل/OTP، رمز، نقش‌های ورزشکار/مربی/مالک، درخواست نقش و بررسی ادمین.
- کشف باشگاه، مربی، کلاس و مقاله؛ جغرافیا، نقشه نشان، علاقه‌مندی و موقعیت ذخیره‌شده.
- پروفایل باشگاه با امکانات، تجهیزات، فضاهای تخصصی، گالری، قانون لغو، اولین مراجعه، جلسه آزمایشی، شلوغی اعلامی و نشان‌های بررسی.
- مدل‌های خدمت مربی، کلاس، جلسه، تقویم، ثبت‌نام و حضور؛ پنل مربی و بررسی پروفایل حرفه‌ای.
- مدیریت شاگرد، مربی داخلی، شعبه، کلاس باشگاه، پرداخت دستی و حضور؛ QR/کد ورود و لیست انتظار کلاس باشگاه.
- بسته جلسات، عضویت زمانی، محدودیت هفتگی، اعتبار، دعوت دوستان و تخفیف؛ ledger، refund و تسویه در دامنه مالی.
- تیکت، SLA و escalation، اعلان، گزارش محتوا، لاگ مدیریتی، داده مرجع و تحلیل محصول.
- import/export و تقویم اشتراکی؛ اپ Capacitor با shell محلی، کش محدود و صف آفلاین علاقه‌مندی‌ها.

وجود مدل یا endpoint به معنی آماده‌بودن کامل آن قابلیت برای مشتری واقعی نیست؛ جدول‌های بعدی همین تفاوت را نشان می‌دهند.

## ۳. بررسی فلوهای اصلی

| فلو | وضعیت قابل مشاهده در کد | تغییر مورد نیاز |
| --- | --- | --- |
| لینک باشگاه → اولین ورود → همان باشگاه | ورود اول به مسیر عمومی به welcome هدایت می‌شود؛ مقصد قبلی در این gate نگه داشته نمی‌شود. بعد از OTP هم نداشتن رمز به صفحه تعیین رمز منتهی می‌شود. [E14](#e14) | مقصد و انتخاب سانس حفظ شود؛ کشف مهمان و ورود در زمان اقدام؛ رمز برای ورزشکار اختیاری شود. |
| جست‌وجو → فیلتر → نتیجه | جست‌وجوی متن وجود دارد؛ انتخاب موقعیت به query وصل نیست و backend جست‌وجو صفحه را روی ۱ تثبیت می‌کند. [E02](#e02) [E03](#e03) | جست‌وجوی واقعی با موقعیت/شرایط، تعداد دقیق، صفحه‌بندی و حفظ فیلتر در URL. |
| کلاس باشگاه → جست‌وجوی عمومی | فهرست کلاس دو منبع دارد، اما جست‌وجوی عمومی فقط مدل کلاس مربی را جست‌وجو می‌کند. [E03](#e03) [E04](#e04) | یک نمای خواندنی مشترک برای هر دو منبع؛ همه کلاس‌های عمومی قابل کشف باشند. |
| باشگاه → سانس → مرور → پرداخت | ظرفیت و گزینه‌ها موجود است؛ قیمت‌گذاری کل زمین در فرم قابل انتخاب نیست؛ provider مالی mock است. [E06](#e06) [E07](#e07) | انتخاب واحد قیمت، quote معتبر، مهلت نگه‌داشت ظرفیت، درگاه واقعی و برگشت پایدار به اپ. |
| پرداخت → لغو → استرداد | سیاست و snapshot وجود دارد؛ متن قبل از تأیید همه پله‌ها را نشان نمی‌دهد و «تغییر زمان» فقط لینک به انتخاب دوباره است. [E08](#e08) | مبلغ دقیق برگشتی قبل از لغو؛ تعویض رزرو با اتصال قدیم/جدید و محاسبه اختلاف؛ وضعیت استرداد تا نتیجه بانکی. |
| خرید بسته → مصرف → تمدید | بسته و مصرف وجود دارد؛ تاریخ عضویت دستی شاگرد و entitlement در مدل‌های جدا هستند؛ صفحه مستقل مدیریت همه بسته‌های ورزشکار دیده نشد. [E15](#e15) | صفحه «عضویت‌های من»، تمدید، توقف طبق قرارداد و هماهنگی پذیرش با حق استفاده واقعی. |
| مربی → تنظیم دسترسی → خدمت/کلاس | فرم دسترسی مقدار نامعتبر می‌فرستد؛ فرم کلاس تعدادی فیلد مدل را همیشه خالی می‌فرستد. [E01](#e01) [E10](#e10) | اصلاح قرارداد؛ ساخت مرحله‌ای خدمت و کلاس، فرم محل/سطح/شرایط و ادامه پیش‌نویس. |
| حضور → نظر → اعتماد | نظر باشگاه به رزرو تکمیل‌شده وابسته است؛ نظر مربی/کلاس ذخیره نمی‌شود؛ پاسخ باشگاه در نگاشت صفحه عمومی حذف می‌شود. [E05](#e05) [E12](#e12) | eligibility مشترک برای انواع حضور، نظر واقعی هر نوع خدمت و نمایش پاسخ/مدرک تجربه. |
| مالک → پذیرش → مالی → کارمند | عملیات اصلی وجود دارد؛ نقش‌های پرسنلی در مدل هستند ولی مسیرهای بررسی‌شده عملیات فقط مالک را می‌پذیرند. [E13](#e13) | مجوز عملیاتی در سطح باشگاه/شعبه و داشبورد متناسب با پذیرش، مالی و مدیر. |

## ۴. ایرادهای مشخص و شکاف مدل تا صفحه

«قطعی از کد» یعنی نگاشت یا رفتار در مسیر بررسی‌شده مشخص است؛ «پیشنهاد مدل» یعنی قابلیت جدید است؛ «نیازمند تست عملیاتی» یعنی وجود کد به‌تنهایی نتیجه محیط اجرا را ثابت نمی‌کند.

| # | مدل/فیلد یا صفحه | شکاف و اثر | اقدام | شاهد |
| --- | --- | --- | --- | --- |
| ۱ | `CoachAvailabilityRule.deliveryModes` | فرم `online,in_person` می‌فرستد؛ backend فقط `club,online,home,outdoor` می‌پذیرد. ذخیره برنامه غیرخالی رد می‌شود؛ با schema واقعی بازتولید شد. | قرارداد مشترک و تست payload واقعی فرم. | [E01](#e01) |
| ۲ | دسترسی مربی: `clubId, validFrom, validUntil` | فرم فقط زمان‌ها را بازسازی می‌کند و هنگام ذخیره clubId و validUntil را null و validFrom را امروز می‌گذارد. اطلاعات تخصصی یک قاعده حفظ نمی‌شود. | فرم محل، شیوه و اعتبار؛ حفظ داده در round-trip. | [E01](#e01) |
| ۳ | جست‌وجو و `ActiveLocation` | انتخاب موقعیت در UI وجود دارد ولی `useCatalogSearch` موقعیت دریافت نمی‌کند. | اتصال موقعیت به پارامتر و کلید cache. | [E02](#e02) |
| ۴ | جست‌وجو و pagination | backend همیشه page=1 می‌سازد؛ صفحه ادامه نتایج ندارد. تعداد کل می‌تواند از نتایج قابل دسترسی بیشتر باشد. | pagination یا cursor مشترک. | [E03](#e03) |
| ۵ | شمارش نتایج نزدیک | query نتایج شرط location دارد ولی برای count حذف می‌شود؛ با شعاع، total با همان محدوده محاسبه نمی‌شود. | شمارش با همان فیلتر مکانی. | [E03](#e03) |
| ۶ | کلاس‌های `classes` و `business_training_classes` | لیست هر دو را دارد؛ جست‌وجو منبع دوم را ندارد. sport و level در کلاس باشگاه متن آزاد هستند. | read model مشترک و مهاجرت به `sportId/skillLevelId` با سازگاری داده قدیمی. | [E03](#e03) [E04](#e04) [E11](#e11) |
| ۷ | فرم نظر مربی/کلاس | پیام موفقیت بدون mutation داده نمایش داده می‌شود. | تا پیاده‌سازی، ارسال غیرفعال و متن صادقانه؛ سپس نظر پایدار برای هر target. | [E05](#e05) |
| ۸ | `ReviewForm.experience` | امتیاز حس تجربه در فرم جمع‌آوری و هنگام submit والد دور انداخته می‌شود. | معنا و کاربرد مشخص، ذخیره/تحلیل؛ یا حذف سؤال. | [E05](#e05) [E12](#e12) |
| ۹ | `ClubReview.ownerResponse, mediaIds` | backend پاسخ مالک و شناسه رسانه دارد؛ نگاشت `ReviewCard` آن‌ها را منتقل نمی‌کند؛ فرم عمومی هم upload نظر ندارد. | نمایش پاسخ، تاریخ، عکس‌های مجاز و وضعیت بررسی. | [E12](#e12) |
| ۱۰ | eligibility نظر باشگاه | فقط `Reservation.status=completed` ملاک است؛ حضور معتبر در کلاس باشگاه به خودی خود این شرط را تأمین نمی‌کند. | اتصال نظر به سابقه تجربه معتبر از همه منابع. | [E12](#e12) |
| ۱۱ | `ReservableSession.pricingUnit` | مدل per-participant/per-session/per-court دارد؛ فرم ساخت سانس ارسال نمی‌کند و default به‌ازای نفر است. | انتخاب واحد و نمایش صریح آن در کارت/quote. | [E06](#e06) |
| ۱۲ | `Club.taxPercent` | در فرم دریافت و ذخیره می‌شود؛ در محاسبه `baseTotal + optionsTotal` رزرو مصرف نمی‌شود. | تعیین شمول/عدم شمول هزینه و انتقال به quote و snapshot؛ نرخ قانونی در این گزارش فرض نشده. | [E06](#e06) [E09](#e09) |
| ۱۳ | قانون لغو: `priority, daysOfWeek, courtIds, sessionTypes` | فرم ساخت سانس نخستین قانون را انتخاب می‌کند؛ backend انتخاب با ID فعال را می‌پذیرد و در این مسیر تطبیق خودکار دامنه‌ها دیده نمی‌شود. | resolver قواعد با پیش‌نمایش یا انتخاب صریح؛ حذف دامنه‌های بدون کاربرد. | [E06](#e06) |
| ۱۴ | `rescheduleCutoffMinutes` | ذخیره و snapshot می‌شود؛ فلو تغییر زمان ورزشکار تعویض رزرو را انجام نمی‌دهد. تغییر جلسه توسط مربی قابلیت جداگانه‌ای است و وجود دارد. | مدل درخواست تعویض، مهلت، اختلاف قیمت و آزادسازی رزرو قبلی. | [E08](#e08) |
| ۱۵ | پرداخت و ظرفیت pending | در مسیرهای بررسی‌شده مهلت انقضا/آزادسازی خودکار رزرو پرداخت‌نشده دیده نشد؛ reconciliation فعلی pending را انتخاب نمی‌کند. انقضای اعتبار تخفیف این مسئله را حل نمی‌کند. | hold زمان‌دار و recovery؛ آزمون رهاکردن پرداخت و callback دیررس. | [E07](#e07) [E22](#e22) |
| ۱۶ | پرداخت مربی در برابر commerce | enum مرجع PaymentIntent شامل رزرو باشگاه، خرید بسته و enrollment باشگاه است؛ booking و enrollment مربی endpointهای mock مستقل دارند. | قرارداد مالی مشترک با adapter هر دامنه و ledger واحد. | [E07](#e07) [E24](#e24) |
| ۱۷ | `Court` | سطح زمین، ابعاد، محیط، گالری، حداقل/حداکثر مدت و buffer موجودند؛ فرم فقط نام، نوع و ظرفیت می‌گیرد. | ویرایشگر واقعی زمین و نمایش اطلاعات مؤثر در تصمیم. | [E06](#e06) |
| ۱۸ | `TrainingClass` مربی | gallery، prerequisites، equipment و amenities همیشه آرایه خالی‌اند؛ محل، سطح، بازه سن، پنجره ثبت‌نام و حالت approval در این فرم انتخاب ندارند. | تکمیل فرم و preview؛ پیش‌نویس قابل ادامه پس از خطای ساخت schedule. | [E10](#e10) |
| ۱۹ | `CoachOffering` | فرم خدمت فقط بخش پایه را می‌گیرد؛ کلاینت pricingType و قانون لغو پیش‌فرض تزریق می‌کند، پس «نبود pricingType» خطای ارسال نیست؛ محدودیت محصول در قابل انتخاب نبودن شرایط است. | فرم و ویرایش شرایط خدمت، قیمت بسته/ماه، سن و مهارت و قانون لغو. | [E25](#e25) |
| ۲۰ | `Coach.geo, travelRadiusKm` | در فرم حرفه‌ای بررسی‌شده امکان تنظیم محدوده جغرافیایی و شعاع خدمت دیده نشد. | محل خدمت و شعاع قابل جست‌وجو، به‌ویژه برای خدمات در محل. | [E16](#e16) |
| ۲۱ | گالری مربی | ذخیره تصاویر به شناسه‌های قبلی اضافه می‌کند؛ حذف UI فقط برای تصاویر همین نشست است، نه تصاویر ذخیره‌شده. | مشاهده، حذف، ترتیب و کاور گالری موجود. | [E16](#e16) |
| ۲۲ | `Club.audience,minAge,maxAge,weeklyHours,closures` | اطلاعات در مدل هست؛ صفحه جزئیات، جدول مستقل کامل برنامه و پذیرش ندارد. weeklyHours بیشتر به شمارش روز و نمودار شلوغی وصل است. reserve بررسی audience/age ندارد. | نمایش شرایط و قواعد پذیرش در سطح سانس؛ اعتبارسنجی مطابق سیاست محصول. | [E09](#e09) [E17](#e17) |
| ۲۳ | `Club.operationalStatus` | صفحه جزئیات وضعیت‌های غیر active را به «بسته/موقتاً بسته» تقلیل می‌دهد. | تفکیک تعمیرات، تعطیلی موقت، تاریخ بازگشت و اثر آن روی رزرو. | [E17](#e17) |
| ۲۴ | `ClubMembership.permissions` | ذخیره می‌شود؛ assertAccepted فقط نقش/وضعیت را چک می‌کند؛ عملیات بررسی‌شده از `findForOwner` عبور می‌کند. | authorization بر اساس قابلیت، با تست مثبت و منفی هر نقش. | [E13](#e13) |
| ۲۵ | تنظیمات پنل باشگاه | نام/ایمیل/تلفن از ترجمه‌ها؛ inputها بدون ذخیره پروفایل؛ switch تسویه صرفاً defaultSelected؛ تصویر آپلودشده فقط در state صفحه می‌ماند. | تنظیمات متصل به داده و حذف کنترل نمایشی از نسخه عمومی. | [E18](#e18) |
| ۲۶ | `/coach` پنل باشگاه | گفت‌وگوی دستیار با داده نمایشی و state محلی است. | حذف از وعده نسخه اول یا اتصال به کاربرد روشن و واقعی. | [E19](#e19) |
| ۲۷ | `ClubStudent.membershipEndsAt` و entitlement | دو مفهوم تاریخ عضویت دستی و حق استفاده خریداری‌شده مستقل‌اند؛ تغییر یکی را نباید به معنی تغییر دیگری دانست. | منبع حقیقت مشخص و رسید/تاریخچه برای تمدید و اصلاح دستی. | [E15](#e15) |
| ۲۸ | `ClubBranch` | شعبه نام/آدرس/تلفن/timezone دارد؛ مختصات و برنامه مستقل در این مدل نیست. | برای توسعه چندشعبه‌ای، location، ساعت، پذیرش و محدوده دسترسی شعبه اضافه شود. | [E11](#e11) |
| ۲۹ | `SupportTicket` | SLA و پیام هست؛ ارتباط ساختاری با booking/payment در schema نیست. | reference امن و CTA پشتیبانی از داخل رسید رزرو. | [E21](#e21) |
| ۳۰ | وضعیت رزرو | جزئیات pending مربی/کلاس را به reserved تبدیل می‌کند؛ تاریخ کل دوره نیز مانند یک بازه جلسه به نمایش می‌رود. | تفکیک «درخواست»، «پرداخت»، «تأیید» و «دوره» از «جلسه». | [E08](#e08) |
| ۳۱ | telemetry و SEO | telemetry به actor احراز‌شده وابسته است؛ sitemap مسیرهای ثابت دارد و جزئیات موجودیت‌ها را فهرست نمی‌کند. | قیف مهمان با شناسه ناشناس محدود؛ صفحات فرود و metadata پویا. | [E26](#e26) [E27](#e27) |

## ۵. صفحه‌هایی که باید تغییر کنند یا اضافه شوند

| سطح | اقدام | محتوا و نتیجه مورد انتظار |
| --- | --- | --- |
| خانه ورزشکار | تغییر | جلسه بعدی، کار فوری، مانده بسته، پیشنهاد تمدید، وضعیت انتظار/پرداخت و پیشنهاد متناسب؛ کمتر شبیه مجموعه کارت‌های مستقل. |
| کشف و جست‌وجو | تغییر | شهر/محله، بودجه، روز/ساعت، نوع پذیرش، سطح، نوع خدمت، ظرفیت واقعی، فیلترهای فعال و رفع بن‌بست نتایج صفر. |
| مقایسه | جدید، P1 | حداکثر سه گزینه با قیمت قابل مقایسه، فاصله، زمان، شرایط لغو، امکانات و نوع تأیید؛ داده نامعلوم صریح باشد. |
| جزئیات باشگاه | تغییر | «مناسب چه کسی؟»، هزینه از چه مقدار، نزدیک‌ترین سانس، ساعت و پذیرش، محدودیت‌ها، نظر معتبر و اولین مراجعه؛ CTA هماهنگ با وضعیت. |
| جزئیات مربی | تغییر | خدمت قابل خرید، محل/شعاع، نتیجه و روش کار، مدرک با وضعیت بررسی، زمان آزاد، نظر معتبر؛ حفظ حریم خصوصی مدارک. |
| جزئیات کلاس | یکپارچه‌سازی | خروجی یکسان برای کلاس مربی و باشگاه: جلسه بعد، کل دوره، پیش‌نیاز، مربی، مکان، سطح، هزینه، شرایط جبران و انتظار. |
| رزرو/پرداخت/رسید | تغییر | quote واحد، تایمر، بازگشت امن از درگاه، شماره پیگیری، وضعیت نامشخص، پشتیبانی همان سفارش و جلوگیری از پرداخت دوباره. |
| عضویت‌های من | جدید | همه بسته‌ها و عضویت‌ها، مانده، اعتبار، محدودیت، مصرف‌ها، تمدید و درخواست توقف/انتقال طبق قرارداد. |
| تعویض زمان/استرداد | جدید یا بازطراحی | اتصال رزرو قدیم/جدید، نمایش اختلاف، وضعیت بانکی و زمان پیگیری؛ مستقل از صفحه لیست سانس. |
| خدمات و کلاس‌های مربی | تفکیک و تکمیل | خدمت، جلسه تقویم و دوره سه مفهوم روشن؛ ویرایش شرایط، رفع خطای انتشار و ادامه پیش‌نویس. |
| پرونده ورزشی | جدید، بعد از پایلوت | هدف، ترجیح زمان/بودجه، برنامه و ثبت تمرین؛ اطلاعات حساس فقط با ضرورت و دسترسی مشخص. |
| صندوق پذیرش | جدید | جست‌وجوی سریع با موبایل، حضور، اعتبار، بدهی و پرداخت دستی متصل به همان سفارش؛ مناسب کار روزانه پذیرش. |
| تمدیدها و ریزش | جدید | عضویت رو به انقضا، غیبت طولانی، پیشنهاد تماس و نتیجه پیگیری با رضایت ارتباطی. |
| پرسنل و دسترسی | جدید/تکمیل دعوت | دعوت، پذیرش، انتخاب نقش و شعبه، مجوزها، تعلیق و تاریخچه تغییر. |
| ادمین مالی | تغییر | وضعیت مستقل درگاه، ledger و تسویه؛ صف مغایرت، refund ناموفق، علت و عملیات قابل ممیزی. |
| ادمین کیفیت عرضه | جدید | پروفایل ناقص، سانس قدیمی، قیمت نامعتبر، شکایت تکراری، مدرک منقضی و مالک مسئول اصلاح. |
| فرود محلی وب | جدید | صفحه شهر/محله/رشته و موجودیت با داده واقعی و لینک به رزرو؛ حفظ مقصد بعد از نصب/ورود. |

## ۶. قابلیت‌هایی که مزیت عملی می‌سازند

۱. **شروع بدون ابهام:** جلسه آزمایشی فعلی را به انتخاب مناسب، راهنمای مراجعه و پیشنهاد عضویت پس از حضور متصل کن. سنجه: تبدیل آزمایشیِ انجام‌شده به خرید؛ نه تعداد کلیک دکمه.

۲. **اطمینان از تناسب:** پیشنهاد بر اساس محله، بودجه، وقت و سطح؛ برای هر پیشنهاد دلیل قابل فهم نشان بده. ابتدا قواعد ساده کافی‌اند و «هوشمند»بودن باید با نتیجه سنجیده شود.

۳. **رزرو قابل اعتماد:** ظرفیت به‌روز، مبلغ نهایی روشن، رسید در دسترس و رسیدگی مشخص وقتی باشگاه نتواند خدمت بدهد. این مزیت به عملیات و قرارداد عرضه‌کننده وابسته است.

۴. **تمدید آسان:** مصرف و مانده قابل فهم برای ورزشکار، فهرست تمدید برای باشگاه و یادآوری قابل کنترل. این بخش مستقیماً به استفاده تکراری متصل است.

۵. **پرونده مشترک مربی و شاگرد:** برنامه تمرین نسخه‌دار، ثبت جلسه، بازخورد و نمودار پیشرفت با رضایت. پس از تثبیت چرخه رزرو اضافه شود؛ در مدل فعلی ثبت تمرین عملیاتی دیده نشد. [E23](#e23)

۶. **رزرو دوستانه و خانوادگی:** مهمان، سرپرست، همراه و تقسیم سهم پرداخت می‌تواند برای زمین/کلاس خانوادگی ارزشمند باشد. این پیشنهاد نیاز به اعتبارسنجی دارد و افزایش participantCount به‌تنهایی آن را پیاده نمی‌کند.

برای ایران در این مسیرها: تومان در رابط با تبدیل دقیق ریال در سیستم، انتخاب تاریخ شمسی، ساعت Asia/Tehran مستقل از دستگاه، ارقام فارسی/عربی، سانس متناسب با گروه پذیرش، تعطیلات و تعطیلی موردی، پیامک جایگزین اعلان حیاتی و تجربه قابل استفاده با اتصال ضعیف باید جزو تعریف کیفیت باشند.

## ۷. برنامه عرضه و مدل کسب‌وکار پیشنهادی

سه دروازه انتشار:

1. **پایلوت تراکنشی:** قرارداد مربی، کشف کلاس، قیمت، ظرفیت pending، پرداخت/استرداد، پیام‌های صادقانه و مسیر کامل مراجعه درست شوند. تا این مرحله از عرضه عمومی پولی عبور نکن.
2. **تکرارپذیری در یک محدوده:** با باشگاه‌های منتخب، پذیرش و تمدید، کیفیت موجودی، مجوز پرسنل، گزارش مالی و پاسخگویی را تثبیت کن.
3. **گسترش و تمایز:** پس از مشاهده استفاده تکراری، مقایسه، پرونده ورزشی، گروه/خانواده و همکاری سازمانی را آزمایش کن.

ترتیب کسب درآمد پیشنهادی برای آزمایش: کارمزد رزروِ مشتری معرفی‌شده، سپس اشتراک ابزار باشگاه پس از اثبات کاهش کار پذیرش/افزایش تمدید. تبلیغ یا جایگاه ویژه تنها با برچسب روشن و پس از وجود ترافیک مفید ارزش دارد. قیمت یا نرخ کارمزد در این گزارش تعیین نشده است.

برای هر رزرو، درآمد کارمزد را با هزینه متغیر پیامک، پرداخت، تخفیف تأمین‌شده توسط پلتفرم، پشتیبانی و هزینه جذب سرشکن‌شده مقایسه کن. رشد تعداد رزرو با حاشیه مشارکت منفی، نتیجه مطلوب پایلوت نیست.

## ۸. سنجه‌های موفقیت و خروج از پایلوت

اعداد زیر **هدف پیشنهادی آزمایش** هستند؛ benchmark بازار یا عملکرد فعلی پروژه نیستند. پس از دو هفته خط مبنا بازتنظیم شوند.

| سنجه | تعریف و پنجره | هدف اولیه پیشنهادی |
| --- | --- | --- |
| سنجه اصلی | تعداد ورزشکار یکتای دارای حداقل دو حضور تأییدشده در ۳۰ روز | روند افزایشی در cohortهای هم‌اندازه، با حاشیه مشارکت قابل قبول |
| صحت تراکنش | موفق بانکی بدون رزرو نهایی، برداشت تکراری، فروش بیش از ظرفیت | صفر مورد حل‌نشده در آزمون پذیرش و پایلوت |
| زمان رسیدن به گزینه | زمان از جست‌وجوی واجد شرایط تا انتخاب سانس | میانه کمتر از ۲ دقیقه در تست وظیفه با کاربران هدف |
| دقت عرضه | سهم نمونه‌های هفتگی که قیمت/سانس/پذیرش با واقعیت باشگاه سازگار است | حداقل ۹۵٪؛ توقف فروش گزینه ناسازگار |
| فعال‌سازی عرضه | باشگاه دعوت‌شده تا پروفایل کامل و حداقل یک خدمت قابل رزرو | حداقل ۸۰٪ در ۷ روز، با کمک onboarding در پایلوت |
| بازگشت خریدار | خریدار اولین خدمت که طی ۳۰ روز خرید دوم انجام می‌دهد | فرضیه شروع ۲۵٪؛ تفکیک رشته و مشتری جذب‌شده/قدیمی |
| تبدیل آزمایشی | حضور آزمایشی تأییدشده که طی ۱۴ روز به خرید منجر می‌شود | فرضیه شروع ۲۰٪ |
| پاسخگویی | زمان اولین پاسخ انسانی به تیکت فوری در ساعات اعلام‌شده | صدک ۹۰ کمتر از ۳۰ دقیقه، مشروط به تیم عملیاتی |
| نیاز به کمک | تراکنش‌هایی که برای تکمیل نیاز به تماس/تیکت دارند | کمتر از ۵٪ پس از تثبیت؛ با تفکیک علت |

قیف را به تفکیک مهمان/عضو، شهر، رشته، منبع جذب و نوع محصول اندازه بگیر. رویدادهای موفق مالی و حضور از سرور بیایند. نمایش cached یا پیام toast نباید رزرو یا حضور موفق شمرده شود.

## ۹. سؤال‌های تصمیم‌ساز باقی‌مانده

- محصول/فروش: اولین شهر، محله و رشته‌ای که واقعاً امکان جذب عرضه دارید کدام است؟ این پاسخ دامنه پایلوت را تعیین می‌کند.
- عملیات/محصول: در لغو توسط باشگاه چه تعهد جایگزینی/بازپرداخت و چه ساعات پشتیبانی خواهید داشت؟
- مالی/مهندسی: ارائه‌دهنده پرداخت و فرآیند واقعی refund/تسویه چیست؟ قرارداد فنی باید با مستندات همان provider نهایی شود.
- محصول: بسته به‌ازای شخص است، رزرو یا زمین؟ ورود مهمان با بسته مجاز است؟
- محصول/حریم خصوصی: کار با افراد زیر سن قانونی و نگهداری مدارک/اطلاعات بدنی در نسخه اول اصلاً در دامنه هست یا نه؟
- تیم: ظرفیت توسعه و پشتیبانی واقعی چقدر است؟ بدون آن، زمان‌بندی تقویمی دقیق قابل اتکا نیست؛ backlog بر اساس وابستگی و اندازه نسبی تنظیم شده است.

خروجی اجرایی در [بک‌لاگ ۴۴ نیازمندی](/Users/mahdi/Documents/projects/Club4Me/docs/product/audit-2026-09-06/requirements-fa.md) و [فهرست کامل مسیرها](/Users/mahdi/Documents/projects/Club4Me/docs/product/audit-2026-09-06/routes-fa.md) قرار دارد.

## اعتبارسنجی انجام‌شده

قرارداد `ReplaceAvailabilityDto.schema` مستقیماً با یک قاعده نمونه فراخوانی شد؛ هیچ داده‌ای در پایگاه داده نوشته نشد:

| ورودی deliveryModes | نتیجه |
| --- | --- |
| `["online", "in_person"]`، مطابق payload فرم | رد؛ گزینه دوم خارج از enum است. |
| `["online", "club"]` با سایر فیلدهای یکسان | قبول. |

برای جلوگیری از مثبت کاذب، ساخت خدمت مربی نیز تا لایه کلاینت دنبال شد: `pricingType` در فرم حذف شده ولی کلاینت مقدار پیش‌فرض معتبر می‌گذارد؛ بنابراین به‌عنوان خرابی ساخت خدمت گزارش نشده است. تست end-to-end، پرداخت واقعی و تست روی گوشی در این بررسی اجرا نشدند. من در این بررسی فقط اسناد گزارش را ایجاد کردم و کد اجرایی را تغییر ندادم.

## شواهد کد

<a id="e01"></a>

**E01 — قرارداد و فرم دسترسی مربی:** [CoachAvailabilityScreen.tsx:50](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/coach/screens/CoachAvailabilityScreen/CoachAvailabilityScreen.tsx:50>) · [coaching.ts:302](</Users/mahdi/Documents/projects/Club4Me/packages/api/src/domains/coaching/coaching.ts:302>) · [coaching.dto.ts:613](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/dto/coaching.dto.ts:613>) · [coaching.constants.ts:13](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/coaching.constants.ts:13>)

<a id="e02"></a>

**E02 — انتخاب موقعیت و درخواست جست‌وجو:** [DiscoverySearchScreen.tsx:62](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoverySearchScreen/DiscoverySearchScreen.tsx:62>) · [ActiveLocationSelector.tsx:44](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/locations/components/ActiveLocationSelector.tsx:44>)

<a id="e03"></a>

**E03 — دامنه و شمارش جست‌وجوی backend:** [discovery.service.ts:92](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/discovery/discovery.service.ts:92>) · [discovery.service.ts:331](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/discovery/discovery.service.ts:331>) · [discovery.service.ts:213](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/discovery/discovery.service.ts:213>)

<a id="e04"></a>

**E04 — دو منبع کلاس در فهرست و انتقال جست‌وجو:** [DiscoveryClassesScreen.tsx:19](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoveryClassesScreen/DiscoveryClassesScreen.tsx:19>) · [DiscoverySearchField.tsx:33](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/components/DiscoverySearchField.tsx:33>)

<a id="e05"></a>

**E05 — ثبت نظر بدون ذخیره برای مربی و کلاس:** [DiscoveryReviewFormScreen.tsx:60](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoveryReviewFormScreen.tsx:60>)

<a id="e06"></a>

**E06 — مدیریت زمین، واحد قیمت و سیاست سانس:** [ReservationManagementScreen.tsx:71](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/clubs/screens/ReservationManagementScreen.tsx:71>) · [reservation.dto.ts:47](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/dto/reservation.dto.ts:47>) · [reservation.dto.ts:115](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/dto/reservation.dto.ts:115>) · [reservations.service.ts:329](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/reservations.service.ts:329>) · [reservations.service.ts:507](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/reservations.service.ts:507>)

<a id="e07"></a>

**E07 — پرداخت mock و انواع مرجع مالی:** [mock-payment.provider.ts:14](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/mock-payment.provider.ts:14>) · [commerce.controller.ts:42](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/commerce.controller.ts:42>) · [commerce.schema.ts:5](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/schemas/commerce.schema.ts:5>) · [commerce.service.ts:273](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/commerce.service.ts:273>)

<a id="e08"></a>

**E08 — لغو، تعویض زمان و نمایش وضعیت:** [ReservationActionScreen.tsx:183](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/reservations/sections/ReservationActionScreen/ReservationActionScreen.tsx:183>) · [ReservationDetailsScreen.tsx:418](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/reservations/screens/ReservationDetailsScreen/ReservationDetailsScreen.tsx:418>) · [ReservationDetailsScreen.tsx:365](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/reservations/screens/ReservationDetailsScreen/ReservationDetailsScreen.tsx:365>) · [ReservationReviewScreen.tsx:299](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/reservations/components/ReservationReviewScreen.tsx:299>)

<a id="e09"></a>

**E09 — فیلدهای باشگاه و استفاده مالی:** [club.schema.ts:269](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/clubs/schemas/club.schema.ts:269>) · [ClubFormScreen.tsx:199](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/clubs/screens/ClubFormScreen.tsx:199>) · [reservations.service.ts:516](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/reservations.service.ts:516>)

<a id="e10"></a>

**E10 — فیلدهای کلاس مربی و payload فرم:** [coaching.schemas.ts:223](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/schemas/coaching.schemas.ts:223>) · [CoachClassFormScreen.tsx:49](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/coach/screens/CoachClassFormScreen/CoachClassFormScreen.tsx:49>)

<a id="e11"></a>

**E11 — کلاس، شاگرد و شعبه باشگاه:** [training-class.schema.ts:13](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/business-operations/schemas/training-class.schema.ts:13>) · [BusinessClassesScreens.tsx:412](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/classes/screens/BusinessClassesScreens.tsx:412>) · [branch.schema.ts:5](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/business-operations/schemas/branch.schema.ts:5>)

<a id="e12"></a>

**E12 — مدل و نگاشت نظر باشگاه:** [club-reviews.service.ts:91](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reviews/club-reviews.service.ts:91>) · [club-reviews.service.ts:168](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reviews/club-reviews.service.ts:168>) · [DiscoveryReviewsScreen.tsx:43](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoveryReviewsScreen/DiscoveryReviewsScreen.tsx:43>) · [ReviewForm.tsx:35](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/components/reviews/ReviewForm.tsx:35>)

<a id="e13"></a>

**E13 — مجوز پرسنل و دسترسی مالک:** [club-membership.schema.ts:17](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/clubs/schemas/club-membership.schema.ts:17>) · [club-memberships.service.ts:86](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/clubs/club-memberships.service.ts:86>) · [business-operations.service.ts:63](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/business-operations/business-operations.service.ts:63>) · [clubs.repository.ts:216](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/clubs/clubs.repository.ts:216>)

<a id="e14"></a>

**E14 — ورود اول و مقصد بعد از احراز هویت:** [welcome-onboarding.ts:48](</Users/mahdi/Documents/projects/Club4Me/apps/application/lib/welcome-onboarding.ts:48>) · [app-route-gate.tsx:38](</Users/mahdi/Documents/projects/Club4Me/apps/application/components/app-route-gate.tsx:38>) · [post-auth-path.ts:28](</Users/mahdi/Documents/projects/Club4Me/apps/application/lib/post-auth-path.ts:28>)

<a id="e15"></a>

**E15 — عضویت دستی، entitlement و مصرف:** [student.schema.ts:15](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/business-operations/schemas/student.schema.ts:15>) · [entitlement.schema.ts:64](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/schemas/entitlement.schema.ts:64>) · [DiscoveryClubSlotsScreen.tsx:170](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoveryClubSlotsScreen/DiscoveryClubSlotsScreen.tsx:170>)

<a id="e16"></a>

**E16 — پروفایل حرفه‌ای و گالری مربی:** [coaching.schemas.ts:107](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/schemas/coaching.schemas.ts:107>) · [CoachProfileFormScreen.tsx:164](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/coach/screens/CoachProfileFormScreen/CoachProfileFormScreen.tsx:164>) · [CoachProfileFormScreen.tsx:208](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/coach/screens/CoachProfileFormScreen/CoachProfileFormScreen.tsx:208>)

<a id="e17"></a>

**E17 — نمایش اطلاعات پذیرش، ساعات و وضعیت باشگاه:** [DiscoveryClubsDetailScreen.tsx:185](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/screens/DiscoveryClubsDetailScreen/DiscoveryClubsDetailScreen.tsx:185>) · [ClubProfileSection.tsx:45](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/discovery/sections/ClubProfileSection.tsx:45>) · [reservations.service.ts:376](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/reservations.service.ts:376>)

<a id="e18"></a>

**E18 — تنظیمات نمایشی پنل باشگاه:** [SettingsScreen.tsx:9](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/settings/screens/SettingsScreen/SettingsScreen.tsx:9>) · [SettingsContentSection.tsx:275](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/settings/sections/SettingsContentSection/SettingsContentSection.tsx:275>) · [SettingsContentSection.tsx:328](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/settings/sections/SettingsContentSection/SettingsContentSection.tsx:328>)

<a id="e19"></a>

**E19 — دستیار نمایشی پنل باشگاه:** [CoachScreen.tsx:4](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/coach/screens/CoachScreen/CoachScreen.tsx:4>) · [CoachThreadSection.tsx:47](</Users/mahdi/Documents/projects/Club4Me/apps/business/modules/coach/sections/CoachThreadSection/CoachThreadSection.tsx:47>)

<a id="e20"></a>

**E20 — آپلود و ذخیره رسانه موجود:** [media.controller.ts:32](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/media/media.controller.ts:32>) · [media.service.ts:67](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/media/media.service.ts:67>) · [media-storage.service.ts:12](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/media/media-storage.service.ts:12>)

<a id="e21"></a>

**E21 — تیکت، SLA و داده مرتبط:** [support.schema.ts:39](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/support/support.schema.ts:39>) · [SupportTicketsScreen.tsx:34](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/support/screens/SupportTicketsScreen.tsx:34>)

<a id="e22"></a>

**E22 — مغایرت‌گیری خودکار و محدوده آن:** [commerce-jobs.service.ts:30](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/commerce-jobs.service.ts:30>) · [commerce.service.ts:495](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/commerce/commerce.service.ts:495>) · [reservations.service.ts:547](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/reservations/reservations.service.ts:547>)

<a id="e23"></a>

**E23 — زیرساخت آفلاین و مسیرهای native:** [offline-updates.md:17](</Users/mahdi/Documents/projects/Club4Me/apps/application/docs/offline-updates.md:17>) · [routes.tsx:19](</Users/mahdi/Documents/projects/Club4Me/apps/application/native/routes.tsx:19>) · [cache.ts:1](</Users/mahdi/Documents/projects/Club4Me/packages/api/src/offline/cache.ts:1>)

<a id="e24"></a>

**E24 — پرداخت مستقل مربی:** [coaching.controller.ts:394](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/coaching.controller.ts:394>) · [bookings.service.ts:273](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/coaching/services/bookings.service.ts:273>)

<a id="e25"></a>

**E25 — فرم خدمت و پیش‌فرض‌های کلاینت:** [CoachReservationsScreen.tsx:117](</Users/mahdi/Documents/projects/Club4Me/apps/application/modules/coach/screens/CoachReservationsScreen/CoachReservationsScreen.tsx:117>) · [coaching.ts:355](</Users/mahdi/Documents/projects/Club4Me/packages/api/src/domains/coaching/coaching.ts:355>)

<a id="e26"></a>

**E26 — اندازه‌گیری فعلی محصول:** [product-telemetry.schema.ts:13](</Users/mahdi/Documents/projects/Club4Me/apps/backend/src/modules/telemetry/schemas/product-telemetry.schema.ts:13>) · [README.md:3](</Users/mahdi/Documents/projects/Club4Me/packages/api/src/tracking/README.md:3>)

<a id="e27"></a>

**E27 — سایت‌مپ ثابت و صفحات عمومی:** [sitemap.ts:5](</Users/mahdi/Documents/projects/Club4Me/apps/application/app/sitemap.ts:5>) · [page.tsx:1](</Users/mahdi/Documents/projects/Club4Me/apps/application/app/discovery/clubs/[clubId]/page.tsx:1>) · [page.tsx:1](</Users/mahdi/Documents/projects/Club4Me/apps/application/app/discovery/coaches/[coachId]/page.tsx:1>)
