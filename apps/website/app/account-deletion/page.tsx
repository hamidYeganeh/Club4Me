import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "حذف حساب | جیم فور می" };

export default function AccountDeletionPage() {
  return (
    <LegalPage
      title="حذف حساب و اطلاعات"
      lead="حذف حساب از داخل اپ فوری است و اطلاعات شخصی وابسته به آن پاک یا برای الزامات قانونی ناشناس می‌شود."
    >
      <section>
        <h2>حذف از داخل اپ</h2>
        <ol className="list-decimal space-y-1 pe-5">
          <li>وارد حساب شوید و صفحه پروفایل را باز کنید.</li>
          <li>«تنظیمات و حریم خصوصی» را انتخاب کنید.</li>
          <li>«حذف دائمی حساب» را بزنید و تأیید کنید.</li>
        </ol>
      </section>
      <section>
        <h2>درخواست بدون دسترسی به اپ</h2>
        <p>
          از همان شماره ثبت‌شده، شماره موبایل و عبارت «حذف حساب» را به{" "}
          <a
            className="text-accent underline"
            href="mailto:support@gym4me.ir?subject=درخواست حذف حساب Gym4Me"
          >
            support@gym4me.ir
          </a>{" "}
          بفرستید. برای جلوگیری از حذف غیرمجاز، مالکیت شماره احراز می‌شود.
        </p>
      </section>
      <section>
        <h2>چه چیزهایی حذف می‌شود؟</h2>
        <p>
          پروفایل، موقعیت‌ها، علاقه‌مندی‌ها، نظرها، اعلان‌ها و شناسه‌های دستگاه
          حذف می‌شوند. سوابقی که نگهداری آن‌ها برای تعهد قانونی یا جلوگیری از
          تقلب لازم است، بدون مشخصات مستقیم یا فقط تا پایان مدت الزام نگهداری
          می‌شوند.
        </p>
      </section>
    </LegalPage>
  );
}
