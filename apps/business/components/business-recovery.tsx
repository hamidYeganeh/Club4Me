"use client";
import Link from "next/link";
export function BusinessRecovery({ missing=false, retry }: {missing?:boolean;retry?:()=>void}) {
 return <main className="mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col justify-center gap-5 p-5 text-center">
  <div className="app-card p-6"><span className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">{missing ? "۴۰۴" : "تلاش دوباره"}</span><h1 className="mt-5 text-2xl font-extrabold">{missing ? "صفحه پیدا نشد" : "نمایش صفحه کامل نشد"}</h1><p className="mt-3 text-sm leading-7 text-muted">{missing ? "ممکن است نشانی صفحه تغییر کرده باشد. از داشبورد ادامه دهید." : "دوباره تلاش کنید یا به داشبورد برگردید."}</p></div>
  {retry ? <button onClick={retry} className="min-h-12 rounded-2xl bg-accent px-5 font-bold text-accent-foreground">تلاش دوباره</button> : null}<Link className="flex min-h-12 items-center justify-center rounded-2xl bg-surface font-bold" href="/">بازگشت به داشبورد</Link>
 </main>;
}
