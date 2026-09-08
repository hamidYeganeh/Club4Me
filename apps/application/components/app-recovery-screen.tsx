"use client";
import Link from "@/components/app-link";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { TaskStatusIntro } from "@/components/task-status-intro";

export function AppRecoveryScreen({ missing = false, onRetry }: { missing?: boolean; onRetry?: () => void }) {
  return <main className="app-page gap-6">
    <SecondaryHeader title={missing ? "صفحه پیدا نشد" : "خطا در نمایش صفحه"} showFilter={false} backHref="/discovery" />
    <div className="mt-8 space-y-5">
      <TaskStatusIntro title={missing ? "این مسیر در دسترس نیست" : "بارگذاری کامل نشد"} tone={missing ? "neutral" : "danger"}>
        {missing ? "ممکن است نشانی تغییر کرده باشد. از بخش کشف، باشگاه یا مربی موردنظرتان را پیدا کنید." : "دوباره تلاش کنید. اگر مشکل ادامه داشت، می‌توانید به صفحه اصلی برگردید."}
      </TaskStatusIntro>
      {onRetry ? <button type="button" onClick={onRetry} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-4 font-bold text-accent-foreground">تلاش دوباره</button> : null}
      <Link href="/discovery" className="flex min-h-12 items-center justify-center rounded-2xl bg-surface px-4 font-bold text-foreground">بازگشت به کشف</Link>
    </div>
  </main>;
}
