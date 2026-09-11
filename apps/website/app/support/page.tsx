import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal-page";

export const metadata = pageMetadata(
  "پشتیبانی",
  "روش‌های تماس با پشتیبانی Gym4Me و راهنمای پیگیری مشکلات حساب و رزرو.",
  "/support",
);

export default function SupportPage() {
  return (
    <LegalPage
      title="پشتیبانی Gym4Me"
      lead="برای پیگیری سریع‌تر، نسخه اپ و شرح کوتاهی از مشکل را همراه پیام ارسال کنید."
    >
      <section>
        <h2>ایمیل پشتیبانی</h2>
        <p>
          <a className="text-accent underline" href="mailto:support@gym4me.ir">
            support@gym4me.ir
          </a>
        </p>
      </section>
      <section>
        <h2>هنگام گزارش مشکل</h2>
        <ul>
          <li>نام صفحه یا نوع رزرو را بنویسید.</li>
          <li>نسخه اپ را از پایین صفحه تنظیمات کپی کنید.</li>
          <li>اطلاعات حساس، رمز عبور یا کد ورود را ارسال نکنید.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
