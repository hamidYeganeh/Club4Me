import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "قوانین استفاده | جیم فور می" };

export default function TermsPage() {
  return (
    <LegalPage
      title="قوانین استفاده"
      lead="استفاده از Gym4Me به معنی پذیرش این شرایط برای جست‌وجو، رزرو و مدیریت خدمات ورزشی است."
    >
      <section>
        <h2>حساب کاربری</h2>
        <p>
          اطلاعات ورود را محرمانه نگه دارید و اطلاعات درست ارائه کنید. هر شخص
          مسئول فعالیت انجام‌شده با حساب خود است.
        </p>
      </section>
      <section>
        <h2>رزرو و حضور</h2>
        <p>
          ظرفیت، زمان، قوانین لغو و شرایط هر خدمت پیش از تأیید نمایش داده
          می‌شود. کاربران و ارائه‌دهندگان باید اطلاعات و زمان‌بندی اعلام‌شده را
          رعایت کنند.
        </p>
      </section>
      <section>
        <h2>محتوای کاربران</h2>
        <p>
          ثبت محتوای غیرقانونی، توهین‌آمیز، گمراه‌کننده یا ناقض حقوق دیگران مجاز
          نیست و ممکن است حذف شود.
        </p>
      </section>
      <section>
        <h2>دسترسی به سرویس</h2>
        <p>
          برای نگهداری، امنیت یا رخدادهای خارج از کنترل ممکن است دسترسی موقتاً
          محدود شود. تغییرات مهم از مسیرهای داخل اپ اعلام می‌شود.
        </p>
      </section>
      <section>
        <h2>پشتیبانی</h2>
        <p>
          برای گزارش مشکل با{" "}
          <a className="text-accent underline" href="mailto:support@gym4me.ir">
            support@gym4me.ir
          </a>{" "}
          تماس بگیرید.
        </p>
      </section>
    </LegalPage>
  );
}
