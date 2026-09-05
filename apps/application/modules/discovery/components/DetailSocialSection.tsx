"use client";

import { useId } from "react";
import { Link, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

const labels: Record<string, string> = {
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  whatsapp: "واتساپ",
  website: "وب‌سایت",
  youtube: "یوتیوب",
  aparat: "آپارات",
  facebook: "فیسبوک",
  linkedin: "لینکدین",
  x: "ایکس",
  email: "ایمیل",
};

export function coachSocialLinks(contact: Record<string, unknown>) {
  return Object.keys(labels).flatMap((platform) => {
    const link = contact[platform];
    return typeof link === "string" ? [{ platform, link }] : [];
  });
}

function safeHref(link: string, platform: string) {
  const value = link.trim();
  if (!value) return null;
  if (platform === "email") {
    const email = value.replace(/^mailto:/i, "");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  }
  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
    );
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function SocialIcon({ platform }: { platform: string }) {
  if (!["instagram", "telegram", "whatsapp"].includes(platform)) {
    return (
      <Icon name={platform === "email" ? "envelope-1" : "globe"} size={28} />
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden="true">
      {platform === "instagram" ? (
        <g stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
        </g>
      ) : null}
      {platform === "telegram" ? (
        <>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            d="m6.5 11.5 10-4c.5-.2.8.1.6.8l-1.7 8c-.1.6-.5.7-.9.4l-2.6-1.9-1.3 1.3c-.1.2-.3.3-.5.3l.2-2.7 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.6-.8c-.6-.2-.6-.5.3-.7Z"
            fill="var(--surface-secondary)"
          />
        </>
      ) : null}
      {platform === "whatsapp" ? (
        <>
          <path
            d="M4.2 17.5 3 21l3.8-1.1A9 9 0 1 0 4.2 17.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 7.1c-.5 0-1.4.9-1.4 2.1 0 2.8 4.1 6.9 7.3 7.1 1.2.1 2.2-.9 2.3-1.5l.1-.9-2.5-1.2-.9 1.1c-1.6-.6-2.8-1.8-3.4-3.2l.8-1.1-1.1-2.4Z"
            fill="currentColor"
          />
        </>
      ) : null}
    </svg>
  );
}

export function DetailSocialSection({
  items = [],
}: {
  items?: Array<{ platform: string; link: string }>;
}) {
  const titleId = useId();
  const links = items.flatMap((item) => {
    const href = safeHref(item.link, item.platform);
    return href ? [{ ...item, href }] : [];
  });
  if (!links.length) return null;

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-full flex-col gap-5 py-5"
    >
      <div className="flex items-center justify-between gap-4 text-foreground">
        <Typography id={titleId} type="h5">
          ما را دنبال کنید
        </Typography>
        <span aria-hidden="true">
          <Icon name="share-2" size={24} />
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {links.map(({ platform, href }, index) => (
          <Link
            key={`${platform}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels[platform] ?? platform}
            className="flex min-h-24 w-full items-center justify-center rounded-[1.75rem] bg-surface-secondary text-foreground no-underline transition-colors hover:bg-accent/12 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <SocialIcon platform={platform} />
          </Link>
        ))}
      </div>
    </section>
  );
}
