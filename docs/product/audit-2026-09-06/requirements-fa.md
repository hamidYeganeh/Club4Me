# بک‌لاگ اجرایی Club4Me برای عرضه رقابتی در ایران

> این سند مبنای پیش از اصلاح است؛ [وضعیت اجرای هر نیازمندی](./implementation-status-fa.md) را برای نتیجه فعلی ببینید.

تاریخ: ۶ سپتامبر ۲۰۲۶. این سند ۴۴ نیازمندی دارد: ۸ مانع عرضه عمومی پولی، ۲۶ نیازمندی مرحله تثبیت، ۱۰ فرصت توسعه مشروط به داده پایلوت.

وضعیت‌ها: **اصلاح** = رفتار مسئله‌دار در کد؛ **تکمیل** = زیرساخت موجود ولی مسیر ناقص؛ **جدید** = قابلیت پیشنهادی. اندازه‌ها نسبی‌اند و زمان‌بندی یا تعهد تحویل نیستند. «بزرگ» باید به چند ticket مستقل شکسته شود.

## هدف و دامنه

هدف، افزایش رزرو منتهی به حضور و خرید تکراری در یک شهر/دسته منتخب است. نسخه اول باید برای ورزشکار، باشگاه و پشتیبانی قابل اتکا باشد. معیارها و فرضیه بازار در گزارش همراه تعریف شده‌اند.

داستان‌های محوری:

- به‌عنوان ورزشکار تازه‌کار می‌خواهم گزینه‌ای متناسب با محله، وقت، بودجه و سطح خود پیدا کنم و قبل از پرداخت شرایط مراجعه را بدانم.
- به‌عنوان عضو باشگاه می‌خواهم مانده بسته، حضور و تاریخ تمدیدم با آنچه پذیرش می‌بیند یکسان باشد.
- به‌عنوان مربی می‌خواهم زمان و محل خدمت را دقیق تنظیم کنم و بتوانم بدون ورود اطلاعات فنی، خدمت یا دوره قابل فروش بسازم.
- به‌عنوان پذیرش می‌خواهم ورود و اعتبار ورزشکار را سریع بررسی کنم و فقط به اطلاعات مورد نیازم دسترسی داشته باشم.
- به‌عنوان پشتیبان می‌خواهم سفارش، پرداخت و اتفاقات مرتبط را یکجا ببینم تا مشکل را بدون درخواست چندباره اطلاعات حل کنم.

برای عرضه نخست، شبکه اجتماعی عمومی، بازار مکمل، برنامه پزشکی خودکار، پوشش همه شهرها و اتصال همه سخت‌افزارهای باشگاه خارج از دامنه پیشنهادی‌اند. این‌ها پروژه‌های جدا با نیاز به اعتبارسنجی تقاضا هستند.

## P0 — دروازه عرضه عمومی پولی

### R01 — اصلاح قرارداد دسترسی مربی

**وضعیت:** اصلاح. **مسئول:** فرانت/بک‌اند. **اندازه:** کوچک تا متوسط. **شاهد:** [E01](#e01).

فرم، نوع‌های کلاینت و DTO باید واژگان یکسانی برای محل و شیوه ارائه داشته باشند؛ اطلاعات قاعده در ویرایش از دست نرود.

معیار پذیرش:

- ذخیره یک بازه برای هر یک از `club/online/home/outdoor` از UI واقعی تا API موفق شود و پس از بارگذاری مجدد یکسان بماند.
- تغییر ساعت یک قاعده، `clubId`، `validFrom`، `validUntil` و شیوه خدمت آن را ناخواسته تغییر ندهد.
- وقتی دریافت داده شکست خورده، فرم خالی به جای برنامه موجود ذخیره نشود؛ خطای فیلد قابل فهم باشد.

### R02 — حذف موفقیت و تنظیمات غیرواقعی

**وضعیت:** اصلاح. **مسئول:** محصول/فرانت. **اندازه:** متوسط. **شاهد:** [E05](#e05) [E18](#e18) [E19](#e19).

نظر مربی/کلاس، تنظیمات حساب و تسویه، و دستیار پنل نباید عملیاتی را وعده دهند که انجام نمی‌شود. پیاده‌سازی کامل نظر در R24 است؛ اقدام فوری غیرفعال‌سازی صادقانه مسیر ناقص است.

معیار پذیرش:

- هر پیام «ثبت شد» تنها پس از پاسخ موفق عملیات پایدار نشان داده شود و نتیجه پس از refresh قابل مشاهده باشد.
- قابلیت آماده‌نشده قبل از گرفتن اطلاعات کاربر مشخص باشد؛ ارسال متن و سپس دور انداختن آن مجاز نباشد.
- نام/تصویر/شماره حساب واقعی نمایش داده شود؛ switch تسویه و دکمه‌های بدون اثر از نسخه عمومی حذف یا واقعاً متصل شوند.

### R03 — جست‌وجوی قابل اعتماد در همه منابع

**وضعیت:** اصلاح/تکمیل. **مسئول:** فرانت/بک‌اند. **اندازه:** متوسط. **شاهد:** [E02](#e02) [E03](#e03) [E04](#e04).

معیار پذیرش:

- تغییر موقعیت منتخب، نتیجه و cache key جست‌وجو را تغییر دهد؛ حذف فیلتر آن را واقعاً حذف کند.
- کلاس عمومی ساخته‌شده در پنل باشگاه و کلاس عمومی مربی هر دو با نام قابل یافتن باشند؛ موارد خصوصی/تأییدنشده نشت نکنند.
- total و pagination از همان شرایط، از جمله شعاع، محاسبه شوند؛ کاربر بتواند از ۲۰ نتیجه نخست عبور کند.
- خطای یکی از منابع با «هیچ نتیجه‌ای نیست» اشتباه نشود؛ retry منبع خراب را هم دوباره بخواند.

### R04 — قیمت نهایی و واحد قیمت‌گذاری واحد

**وضعیت:** اصلاح/تکمیل. **مسئول:** محصول/بک‌اند/فرانت. **اندازه:** متوسط تا بزرگ. **شاهد:** [E06](#e06) [E09](#e09).

معیار پذیرش:

- مالک انتخاب کند قیمت به‌ازای نفر، سانس یا زمین است؛ همین واحد در کارت و مرور پرداخت نمایش داده شود.
- مثال پذیرش: قیمت یک زمین ۶۰۰ هزار تومان برای چهار نفر، در حالت per-court برابر ۶۰۰ هزار و در حالت per-participant برابر ۲ میلیون و ۴۰۰ هزار تومان باشد.
- backend quote شامل مبلغ پایه، تعداد، خدمات جانبی، تخفیف، سهم کیف پول و هزینه‌های قابل اعمال را برگرداند؛ صفحه مرور و پرداخت از همان quote استفاده کنند.
- نقش `taxPercent` و شامل‌بودن/نبودن آن روشن باشد؛ مبلغی که کاربر تأیید می‌کند بدون تأیید دوباره تغییر نکند. قانون/نرخ مالیات باید جداگانه برای مدل کسب‌وکار تعیین شود.
- مبنای ذخیره پول و تبدیل تومان/ریال صریح، صحیح و بدون اعشار نامعتبر باشد؛ مبلغ و قواعد مؤثر snapshot شوند.

### R05 — نگه‌داشت زمان‌دار ظرفیت و بازیابی رزرو رهاشده

**وضعیت:** تکمیل. **مسئول:** بک‌اند. **اندازه:** بزرگ. **وابستگی:** R04. **شاهد:** [E07](#e07) [E22](#e22).

معیار پذیرش:

- رزرو پرداخت‌نشده مهلت قابل تنظیم، برای نمونه ۱۰ دقیقه، داشته باشد؛ تایمر UI از زمان سرور محاسبه شود.
- پس از پایان مهلت، ظرفیت، گزینه جانبی و اعتبار رزروشده دقیقاً یک بار آزاد شوند؛ restart worker و retry همان نتیجه را بدهند.
- در رقابت برای آخرین ظرفیت فقط شمار مجاز رزرو قطعی شود؛ درخواست تکراری همان نتیجه قبلی را برگرداند.
- پرداخت موفق دیررس با وضعیت ظرفیت تطبیق داده شود: تأیید امن یا استرداد قابل پیگیری؛ کاربر هم‌زمان «ناموفق» و «قطعی» نبیند.
- سناریوی قطع اجرای سرویس بین ثبت ظرفیت و ثبت رزرو، با transaction یا فرایند بازیابی قابل اثبات پوشش داده شود.

### R06 — پرداخت واقعی مشترک برای تمام محصولات قابل فروش

**وضعیت:** تکمیل. **مسئول:** بک‌اند/فرانت/عملیات مالی. **اندازه:** بزرگ. **وابستگی:** R04، R05. **شاهد:** [E07](#e07) [E24](#e24).

معیار پذیرش:

- رزرو باشگاه، جلسه مربی، دوره مربی، کلاس باشگاه و بسته‌ای که در release عرضه می‌شود مسیر پرداخت واقعی داشته باشد؛ محصول خارج از پوشش قابل فروش نباشد.
- نتیجه توسط verify سمت سرور و مطابق قرارداد provider تعیین شود؛ callback و retry تکراری دوباره ظرفیت/ledger را تغییر ندهند.
- تأیید پرداخت با کنترل موجودی و وضعیت خدمت سازگار باشد؛ بستن مرورگر بانکی یا اپ، نتیجه را گم نکند.
- وضعیت «در حال بررسی» و بازیابی نتیجه از رسید وجود داشته باشد؛ بازگشت از درگاه روی وب و Android آزمایش شود.
- endpointهای تأیید/رد mock در production قابل استفاده نباشند؛ هیچ کاربر مشتری نتواند پرداخت خود را دستی موفق اعلام کند.

### R07 — بازپرداخت و تسویه با نتیجه قابل پیگیری

**وضعیت:** تکمیل. **مسئول:** بک‌اند/عملیات مالی/فرانت. **اندازه:** بزرگ. **وابستگی:** R06. **شاهد:** [E07](#e07) [E08](#e08) [E22](#e22).

معیار پذیرش:

- قبل از تأیید لغو، مبلغ و اجزای بازگشت، مقصد وجه و سیاست اعمال‌شده نمایش داده شوند.
- استرداد درخواست‌شده، در حال پردازش، موفق و ناموفق وضعیت‌های مجزا داشته باشد؛ شناسه provider و اثر ledger قابل ردیابی باشند.
- تسویه باشگاه/مربی با مانده قابل برداشت و تعهد استرداد سازگار باشد؛ ثبت وضعیت paid به معنی صرفاً فشردن دکمه ادمین نباشد.
- reconciliation علاوه بر توازن بدهکار/بستانکار، نتیجه بیرونی پرداخت/refund و موارد pending را پوشش دهد.
- استرداد جزئی و ترکیب کیف پول/تخفیف/درگاه دوبار اعتبار نسازند؛ مغایرت وارد صف عملیات شود.

### R08 — آزمون پذیرش مسیر پولی روی محیط عرضه

**وضعیت:** تکمیل/اعتبارسنجی. **مسئول:** QA/مهندسی/عملیات. **اندازه:** متوسط. **وابستگی:** R01 تا R07.

معیار پذیرش:

- برای هر نوع محصول عرضه‌شده، کشف → ورود → خرید → رسید → حضور → لغو مجاز/استرداد روی Android و وب با حساب‌های مجزا کامل شود.
- قطع اینترنت در مرحله انتخاب، بعد از پرداخت و هنگام دریافت نتیجه وضعیت نادرست تولید نکند؛ عملیات مالی آفلاین بی‌اجازه صف نشوند.
- خطای OTP، ظرفیت تمام‌شده، حساب فاقد مجوز، داده صفر، سرویس قطع و نتیجه بانکی نامشخص پیام و اقدام بعدی داشته باشند.
- اطلاعات گیرنده، اعلان و مبلغ در حساب ورزشکار/باشگاه/ادمین یکسان باشند؛ rollout محدود با امکان توقف فروش و برگشت نسخه انجام شود.

## P1 — تثبیت تجربه، تکرار خرید و کار روزانه باشگاه

| شناسه | نیازمندی / وضعیت / اندازه | خروجی و معیار پذیرش | وابستگی و مسئول |
| --- | --- | --- | --- |
| R09 | ورود سبک و حفظ مقصد؛ اصلاح؛ متوسط | لینک موجودیت پس از welcome/OTP به همان موجودیت و انتخاب برگردد؛ ورزشکار برای اولین رزرو مجبور به تعیین رمز نشود؛ درخواست نقش حرفه‌ای در زمان نیاز باشد. [E14](#e14) | R08؛ محصول/فرانت/بک‌اند |
| R10 | فیلتر متناسب با تصمیم؛ تکمیل؛ متوسط | محله، بودجه، روز/ساعت، نوع پذیرش، سطح و نوع خدمت با API اعمال شوند؛ حالت URL قابل اشتراک و پاک‌کردن فیلتر وجود داشته باشد؛ برای نتایج صفر نزدیک‌ترین جایگزین با تفاوت واضح پیشنهاد شود. | R03، R04؛ محصول/فرانت/بک‌اند |
| R11 | کارت و مقایسه گزینه‌ها؛ تکمیل/جدید؛ متوسط | قیمت از، واحد، زمان بعدی، فاصله و شرایط اصلی در کارت؛ مقایسه حداکثر سه گزینه با واحد قابل قیاس؛ داده نامشخص به «ندارد» تبدیل نشود. | R10؛ محصول/فرانت |
| R12 | پروفایل تصمیم‌ساز باشگاه؛ تکمیل؛ متوسط | ساعات واقعی، تعطیلی موردی، گروه پذیرش، سن، هزینه جانبی، راهنمای ورود و تازه‌بودن اطلاعات قابل مشاهده باشند؛ CTA در تعطیلی و نداشتن ظرفیت درست تغییر کند. [E17](#e17) | R04، R10؛ فرانت/بک‌اند |
| R13 | ویرایشگر زمین و فضا؛ تکمیل؛ متوسط | محیط، سطح، ابعاد، تصویر، محدودیت مدت و زمان آماده‌سازی قابل تنظیم و بازخوانی باشند؛ همپوشانی با buffer به کاربر نشان داده شود. [E06](#e06) | R04؛ فرانت/بک‌اند |
| R14 | تقویم عملیاتی مشترک؛ تکمیل؛ بزرگ | تقویم روز/هفته مربی، زمین و کلاس باشگاه تعارض را نشان دهد؛ ایجاد تکرارشونده، تعطیلی استثنایی و تغییر «این جلسه/جلسات آینده» اثر قابل پیش‌نمایش داشته باشند. ایجاد کلاس باشگاه نیز در کنترل تعارض لحاظ شود. | R01، R13، R15؛ بک‌اند/فرانت |
| R15 | فرم و چرخه کامل کلاس؛ تکمیل؛ بزرگ | کلاس مربی/باشگاه قرارداد نمایش یکسان داشته باشند؛ سطح، سن، ظرفیت، پنجره ثبت‌نام، محل، تصاویر و پیش‌نیازها قابل مدیریت شوند؛ شکست schedule پیش‌نویس قابل ادامه بسازد؛ انتشار علت دقیق آماده‌نبودن را نشان دهد. [E10](#e10) [E11](#e11) | R03، R13؛ محصول/فرانت/بک‌اند |
| R16 | مدیریت شرایط خدمت مربی؛ تکمیل؛ متوسط | نوع جلسه/بسته/ماه، تعداد جلسات، گروه هدف، تجهیزات و قانون لغو قابل تنظیم و ویرایش باشند؛ اطلاعات خریدهای قبلی با ویرایش آینده تغییر نکند. defaults فعلی در UI به مربی نشان داده شوند. [E25](#e25) | R04، R06؛ فرانت/بک‌اند |
| R17 | پروفایل، محدوده و مدارک مربی؛ تکمیل؛ متوسط | شهر/محله/شعاع و محل‌های خدمت، گالری ذخیره‌شده قابل حذف/ترتیب و تصویر کاور؛ مدرک با وضعیت/تاریخ بررسی مشخص و دسترسی متناسب؛ خوداظهاری به جای تأیید رسمی نشان داده نشود. [E16](#e16) | R01؛ فرانت/بک‌اند/عملیات |
| R18 | تعویض زمان واقعی و قواعد لغو؛ تکمیل؛ بزرگ | انتخاب سیاست بر اساس روز/زمین/نوع یا انتخاب صریح مالک؛ تعویض رزرو با شناسه قبلی، مهلت و اختلاف قیمت؛ شکست رزرو جدید قبلی را از بین نبرد؛ لغو جدید به لغو خودکار نامرتبط منجر نشود. [E06](#e06) [E08](#e08) | R04 تا R07؛ بک‌اند/فرانت |
| R19 | صفحه عضویت‌های من؛ جدید روی مدل موجود؛ متوسط | همه بسته‌ها و عضویت‌ها با اعتبار، مانده، محدودیت هفتگی، خدمات مشمول و سابقه مصرف دیده شوند؛ علت نامعتبر بودن بسته برای یک سانس روشن باشد. [E15](#e15) | R06؛ فرانت/بک‌اند |
| R20 | تمدید و توقف قرارداد عضویت؛ تکمیل؛ بزرگ | تمدید فوری/پس از پایان، درخواست توقف محدود و تغییر پلن طبق قرارداد؛ تاریخچه before/after و عامل تغییر؛ مانده و تاریخ پذیرش با اپ یکسان باشند؛ تاریخ دستی شاگرد جای entitlement را نگیرد. | R19، R21؛ محصول/بک‌اند/فرانت |
| R21 | میز پذیرش واحد؛ تکمیل؛ بزرگ | جست‌وجوی موبایل، عضویت، کلاس، بدهی و ورود در یک صفحه؛ QR/کد فعلی کلاس حفظ و برای خدمات لازم تعمیم یابد؛ هر حضور به منبع رزرو/عضویت وصل شود؛ اصلاح حضور با audit و بازگرداندن صحیح اعتبار. | R19، R22؛ بک‌اند/فرانت |
| R22 | دسترسی پرسنل واقعی؛ تکمیل؛ بزرگ | مدیر، پذیرش، مالی و مربی فقط عملیات و داده مجاز همان باشگاه/شعبه را ببینند؛ دعوت و لغو دسترسی پایدار؛ تست مثبت/منفی برای هر نقش و API. [E13](#e13) | مالکیت باشگاه؛ بک‌اند/فرانت |
| R23 | حساب شاگرد و وصول شهریه؛ تکمیل؛ بزرگ | پرداخت دستی و آنلاین به سفارش/عضویت مربوط متصل شوند؛ بدهی، پرداخت جزئی، تخفیف مجاز و رسید روشن؛ برنامه اقساط و یادآوری در صورت نیاز واقعی پایلوت؛ دوباره‌شماری درآمد رخ ندهد. | R04، R06، R20، R22؛ مالی/بک‌اند/فرانت |
| R24 | نظر واقعی برای همه خدمات؛ تکمیل؛ متوسط تا بزرگ | target باشگاه/مربی/کلاس و مدرک حضور معتبر؛ هر نظر واقعاً ذخیره شود؛ پاسخ مالک و تصاویر مجاز نمایش داده شوند؛ احساس تجربه ذخیره یا حذف شود؛ تغییر امتیاز و moderation در همه نماها سازگار باشد. [E05](#e05) [E12](#e12) | R02، R21؛ بک‌اند/فرانت/عملیات |
| R25 | چرخه رسانه مناسب عرضه؛ تکمیل؛ متوسط | upload موجود حفظ شود؛ ماندگاری فایل روی استقرار و backup آزمایش شود؛ تصاویر بندانگشتی/فشرده و metadata گالری استفاده شوند؛ حذف/ترتیب پایدار و دسترسی مستقل به مدرک خصوصی فراهم باشد. storage چندنمونه‌ای در صورت نیاز معماری انتخاب شود. [E20](#e20) | R17؛ زیرساخت/بک‌اند/فرانت |
| R26 | پشتیبانی متصل به سفارش؛ تکمیل؛ متوسط | از رسید تیکت با referenceType/referenceId ساخته شود؛ پشتیبان مجاز timeline پرداخت/رزرو را ببیند؛ SLA و escalation موجود حفظ شوند؛ نتیجه حل و اطلاع به کاربر ثبت شود. [E21](#e21) | R06، R07، R22؛ عملیات/بک‌اند/فرانت |
| R27 | اعلان عملیاتی و تمدید؛ تکمیل؛ متوسط | یادآوری‌های موجود با لغو/تغییر زمان به‌روز شوند؛ رویدادهای حیاتی fallback پیامک و گزارش تحویل داشته باشند؛ تبلیغ و خدماتی قابل تفکیک؛ پیام تمدید با رضایت و بدون تکرار ارسال شود. | R18، R20؛ بک‌اند/عملیات |
| R28 | تاریخ، پول، نشانی و پذیرش بومی؛ تکمیل؛ متوسط | ورود تاریخ شمسی و ارقام فارسی/عربی؛ نمایش زمان بر اساس timezone خدمت؛ تومان/ریال یکسان؛ تعطیلی و برنامه پذیرش بانوان/آقایان/کودک/خانواده در سطح خدمت قابل تعریف؛ با تغییر timezone دستگاه زمان خدمت نلغزد. | R04، R12، R15؛ فرانت/بک‌اند |
| R29 | قیف و داشبورد تصمیم‌گیری؛ تکمیل؛ متوسط | مهمان تا خرید/حضور/تمدید با شناسه ناشناس محدود و پیوند امن بعد ورود؛ رویداد مالی سمت سرور؛ گزارش cohort، کانال جذب، رشته و نوع خدمت؛ تعریف هر سنجه و حذف دوباره‌شماری مستند باشد. [E26](#e26) | R06، R21؛ داده/بک‌اند/فرانت |
| R30 | فعال‌سازی عرضه؛ تکمیل؛ متوسط | wizard مالک از ثبت تا اولین سانس، چک‌لیست نقص و پیش‌نمایش عمومی؛ import فعلی با نمونه و گزارش خطا؛ داشبورد صف باشگاه‌های متوقف‌شده در onboarding و علت آن. | R12 تا R16؛ فروش/عملیات/فرانت |
| R31 | کیفیت و تازگی عرضه؛ جدید روی داده موجود؛ متوسط | مسئول و موعد تأیید قیمت/برنامه، نشان آخرین بررسی و queue مغایرت؛ شکایت تکراری و سانس قدیمی برای اپراتور قابل اقدام؛ داده مشکوک تا بررسی از فروش خارج شود. | R24، R26، R30؛ عملیات/بک‌اند |
| R32 | صفحات فرود محلی و اشتراک لینک؛ تکمیل؛ متوسط | صفحه قابل index برای باشگاه/رشته/شهر دارای عرضه؛ title، توضیح، canonical و sitemap داده‌محور؛ لینک share به همان محتوا برسد؛ صفحه تهی انبوه برای محله بدون عرضه ساخته نشود. [E27](#e27) | R03، R09، R31؛ وب/محتوا |
| R33 | رضایت و دسترسی داده حساس؛ تکمیل؛ متوسط | نقش داده حساب، مدرک، نشانی و پرونده بدنی جدا شود؛ رضایت نسخه‌دار برای قابلیت مربوط؛ حذف حساب با چرخه داده موجود هماهنگ؛ مدرک خصوصی یا یادداشت مربی در API عمومی نباشد؛ قبل از افزودن داده بدنی policy دسترسی اجرا شود. | R22، R25؛ محصول/بک‌اند |
| R34 | کیفیت تجربه روی دستگاه و اتصال ضعیف؛ تکمیل؛ متوسط | کش و shell آفلاین موجود حفظ شوند؛ ظرفیت و موجودی مالی stale به‌عنوان زنده نمایش داده نشوند؛ فرم در خطا داده را نگه دارد؛ focus، keyboard، RTL، اندازه متن و tap target روی دستگاه هدف تست شوند؛ بودجه عملکرد با دستگاه واقعی تعیین شود. [E23](#e23) | R08؛ QA/فرانت |

## P2 — مزیت‌های بعد از اثبات پایلوت

| شناسه | نیازمندی / اندازه | آزمون ارزش و معیار پذیرش | وابستگی |
| --- | --- | --- | --- |
| R35 | برنامه تمرین و ثبت اجرا؛ بزرگ | مدل‌های `Exercise/WorkoutPlan/WorkoutSession/ExerciseLog` با ست، تکرار، وزنه و نسخه برنامه؛ مربی برنامه می‌دهد، ورزشکار اجرا ثبت می‌کند؛ ثبت آفلاین با تعارض مشخص؛ ابتدا روی یک رشته. موفقیت با استفاده هفتگی و retention سنجیده شود. | R17، R33، R34 |
| R36 | ارتباط مربی و شاگرد؛ بزرگ | گفت‌وگوی مرتبط با خدمت خریداری‌شده، فایل/بازخورد، زمان پاسخ اعلام‌شده و گزارش مزاحمت؛ لغو اشتراک، مرز دسترسی را رعایت کند؛ چت نمایشی قبلی مبنای موفقیت نباشد. | R06، R26، R33 |
| R37 | پیشرفت قابل مشاهده؛ متوسط | اندازه‌گیری اختیاری و هدف قابل اصلاح، روند تمرین/حضور و ارزیابی مربی؛ عکس پیشرفت فقط خصوصی و با رضایت؛ شاخص سلامت یا وعده نتیجه بدون مبنا تولید نشود. | R35، R33 |
| R38 | حساب سرپرست و اعضای خانواده؛ بزرگ | رزروکننده، شرکت‌کننده و سرپرست مدل جدا داشته باشند؛ رضایت و ارتباط ضروری مشخص؛ eligibility براساس شرکت‌کننده، نه صرفاً صاحب حساب؛ برای کلاس کودک پایلوت مستقل. | R06، R21، R33 |
| R39 | رزرو گروه و سهم پرداخت؛ بزرگ | دعوت دوستان، سهم هر نفر، مهلت و قاعده کسری وجه روشن؛ رزرو زمین دوباره ساخته نشود؛ غیبت/لغو یک نفر اثر تعریف‌شده بر گروه داشته باشد. ابتدا علاقه‌مندی کاربران زمین را بسنجید. | R04 تا R07، R38 در صورت خانواده |
| R40 | مدیریت چندشعبه‌ای عمیق؛ بزرگ | مختصات، برنامه، کارکنان، ظرفیت و گزارش هر شعبه؛ حق استفاده بین شعب فقط با قرارداد پلن؛ جست‌وجوی شعبه نزدیک با آدرس واقعی. | R14، R20، R22 |
| R41 | ورزش سازمانی؛ بزرگ | سازمان، بودجه دوره، کارکنان مجاز، سهم سازمان/کاربر و گزارش مصرف تجمیعی؛ اطلاعات بدنی شخصی برای کارفرما منتشر نشود؛ ابتدا با یک مشتری سازمانی قرارداد آزمایشی. | R06، R20، R29، R33 |
| R42 | پرکردن سانس کم‌تقاضا؛ متوسط | تخفیف محدود به زمان/عرضه با کف قیمت مالک، سقف هزینه کمپین و اندازه‌گیری رزرو افزایشی؛ کاهش فروش قیمت کامل را جدا بسنجید. بر بستر تخفیف موجود توسعه یابد. | R04، R29، R31 |
| R43 | اتصال گیت/کمد/حسابداری؛ بزرگ | یک adapter برای سخت‌افزار یا نرم‌افزار واقعی شریک پایلوت؛ شناسه عضویت و ثبت حضور دوباره نشوند؛ قطع ارتباط مسیر دستی قابل ممیزی داشته باشد. | R21 تا R23 |
| R44 | دستیار هوشمند کاربردی؛ متوسط تا بزرگ | ابتدا جست‌وجوی زبان طبیعی یا پاسخ به قواعد همان باشگاه؛ نتیجه دارای داده منبع و امکان اصلاح؛ هیچ رزرو/پرداخت بدون تأیید کاربر انجام نشود؛ پاسخ نامطمئن به پشتیبانی منتقل شود. ارزش با تکمیل وظیفه سنجیده شود. | R03، R04، R26، R29 |

## قرارداد مدل‌های پیشنهادی

نام‌ها پیشنهاد طراحی‌اند و باید با معماری فعلی تطبیق داده شوند؛ همه آن‌ها الزام به collection جدید ندارند.

| مفهوم | فیلدهای کلیدی | قاعده |
| --- | --- | --- |
| نمای یکپارچه خدمت | `sourceType, sourceId, provider, sportId, venue, deliveryMode, nextSession, priceUnit, audience, level, availabilityState` | مجموعه‌های اجرایی می‌توانند جدا بمانند؛ نمایش/جست‌وجو قرارداد واحد داشته باشد. |
| quote قیمت | `lineItems, currency, displayUnit, discount, walletContribution, fees, total, expiresAt, pricingVersion` | مرجع محاسبه سرور؛ نسخه و اجزای پذیرفته‌شده روی خرید ثبت شوند. |
| hold ظرفیت | `referenceType, referenceId, participantCount, heldOptions, expiresAt, status, idempotencyKey` | تبدیل یا آزادسازی دقیقاً یک بار؛ هماهنگ با پرداخت دیررس. |
| تعویض رزرو | `oldBookingRef, newSessionRef, quote, deltaAmount, status, reason, policyVersion` | جابه‌جایی حسابداری و ظرفیت مرتبط باشند. |
| قرارداد عضویت | `beneficiaryId, productVersion, startsAt, endsAt, remainingUses, freezePolicy, allowedVenues, usageRules` | حق استفاده از متن عنوان عضویت استنتاج نشود. |
| تجربه قابل نظر | `targetType, targetId, attendanceRef, authorId, rating, criteria, media, ownerResponse, moderationState` | eligibility براساس حضور معتبر؛ شناسه مرجع از طرف سرور تأیید شود. |
| پذیرش خدمت | `audience, ageRange, guardianRequirement, requiredDocuments, requiredItems, exceptions` | در سطح جلسه/خدمت؛ preference کاربر از مجوز پذیرش تفکیک شود. |
| تیکت سفارش | `referenceType, referenceId, permittedContext, status, sla, resolution` | دسترسی reference همان requester و تیم مجاز کنترل شود. |
| ترجیحات ورزشکار | `goals, sportIds, skillLevel, budgetRange, preferredTimes, preferredArea` | قابل ردکردن/ویرایش؛ پرسش فقط وقتی کاربرد قابل توضیح دارد. |
| پرسنل | `clubId, branchScopes, role, permissions, status, invitedBy, acceptedAt` | منبع authorization؛ فقط برچسب نمایشی نباشد. |

## ترتیب اجرای پیشنهادی

1. بسته «صحت محصول»: R01 و R02؛ مانع‌های ساده و اعتمادسوز را زود رفع کن.
2. بسته «کشف تا قیمت»: R03 و R04، همراه با تعریف read model و قواعد پذیرش.
3. بسته «تراکنش»: R05 سپس R06 و R07؛ state machine پیش از اتصال UI جدید مشخص شود.
4. بسته «پایلوت»: R08 و حداقل‌های R09/R12/R28/R30 متناسب با عرضه منتخب. محدودیت‌های باقی‌مانده پیش از فروش اعلام شوند.
5. بسته «استفاده روزانه»: R19/R21/R22/R23/R26؛ سپس R20/R27 برای تمدید.
6. بسته «رشد قابل سنجش»: R10/R11/R24/R29/R31/R32؛ R33 و R34 همراه توسعه مربوط اجرا شوند.
7. یک فرصت P2 با شواهد تقاضا انتخاب شود؛ همه ده فرصت هم‌زمان شروع نشوند.

وابستگی‌های جدول بر زمان‌بندی برتری دارند. اگر تیم کوچک است، یک نوع خدمت پولی را end-to-end کامل کنید و فروش انواع ناقص را تا نوبت خود متوقف نگه دارید. تخمین تقویمی بعد از تعیین افراد، ظرفیت، provider و دامنه پایلوت انجام شود.

## نمونه آزمون‌های پذیرش مشترک

- آخرین ظرفیت، دو کاربر هم‌زمان؛ فقط یک خرید/رزرو معتبر.
- callback موفق دوبار و با تأخیر بعد از expiry؛ نتیجه مالی و ظرفیت یکسان و قابل بازیابی.
- خروج از اپ در درگاه و بازکردن رسید از اعلان؛ سفارش همان سفارش باشد.
- لغو با وجه ترکیبی؛ جمع اجزای بازگشتی و هزینه‌ها با قرارداد سازگار.
- ویرایش قیمت یا سیاست پس از خرید؛ قرارداد خرید قبلی تغییر نکند.
- تغییر ساعت دستگاه و انتخاب تاریخ مرز ماه شمسی؛ زمان خدمت ثابت بماند.
- تغییر نقش یا باشگاه؛ داده مالی/شاگرد باشگاه قبلی قابل دسترسی نباشد.
- خرید کلاس از هر دو منبع؛ کشف، رسید، حضور و eligibility نظر مسیر کامل داشته باشند.
- شکست API در بخشی از صفحه؛ داده جعلی/موفقیت کاذب و «خالی» گمراه‌کننده نشان داده نشود.

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
