"use client";
import { usePathname } from "next/navigation";
import { useAccountMe } from "@api/account";
import { Avatar } from "@heroui/react";
import { Icon } from "@theme/icon";
import { Logo } from "@theme/logo";
import Link from "@/components/app-link";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { secondaryHeaderStyles } from "@modules/discovery/components/SecondaryHeader/SecondaryHeader.styles";
import type { AthleteScreenHeaderSectionProps } from "./AthleteScreenHeaderSection.types";

export function AthleteScreenHeaderSection({
  title,
}: AthleteScreenHeaderSectionProps) {
  const pathname = usePathname();
  const me = useAccountMe();
  const styles = secondaryHeaderStyles();
  const isHome = pathname === "/athlete" || pathname === "/coach";
  const role = pathname === "/coach" ? "coach" : "athlete";
  if (!isHome)
    return (
      <SecondaryHeader title={title} showBack={false} showFilter={false} />
    );
  return (
    <>
      <header className={styles.root()} aria-label="جیم‌فورمی">
        <div
          className="grid w-full grid-cols-[3rem_1fr_3rem] items-center gap-3"
          dir="rtl"
        >
          <Link
            href={`/${role}/profile`}
            aria-label="پروفایل من"
            className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Avatar className="size-12 rounded-2xl bg-accent/15">
              <Avatar.Image
                src={me.data?.avatarUrl ?? undefined}
                alt="پروفایل من"
              />
              <Avatar.Fallback>
                <Icon name="user" size={24} />
              </Avatar.Fallback>
            </Avatar>
          </Link>
          <Link
            href={`/${role}`}
            aria-label="جیم‌فورمی"
            className="mx-auto rounded-xl text-accent outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Logo size={40} label="جیم‌فورمی" />
          </Link>
          <Link
            href={`/${role}/notifications`}
            aria-label="اعلان‌ها"
            className="grid size-12 place-items-center rounded-2xl bg-background outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Icon name="bell-1" size={24} />
          </Link>
        </div>
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}
