import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@theme/theme-toggle";
import { applicationLink } from "@/modules/marketing/lib/application-link";
import styles from "@/modules/discovery/discovery.module.css";
export default function DiscoveryLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a href="#discovery-content" className={styles.skip}>
        رفتن به محتوای صفحه
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="/" aria-label="Gym4Me، صفحه اصلی">
            GYM4ME
          </Link>
          <nav className={styles.nav} aria-label="کشف">
            <Link href="/discovery/clubs">باشگاه‌ها</Link>
            <Link href="/discovery/classes">کلاس‌ها</Link>
            <Link href="/discovery/coaches">مربی‌ها</Link>
            <Link href="/discovery/articles">مقالات</Link>
          </nav>
          <ThemeToggle />
          <a className={styles.button} href={applicationLink("/discovery")}>
            ورود به اپ
          </a>
        </div>
      </header>
      <main id="discovery-content" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <Link href="/">Gym4Me</Link>
        <Link href="/privacy">حریم خصوصی</Link>
        <Link href="/terms">شرایط استفاده</Link>
        <Link href="/support">پشتیبانی</Link>
        <a href={applicationLink("/athlete")}>حساب من</a>
      </footer>
    </div>
  );
}
