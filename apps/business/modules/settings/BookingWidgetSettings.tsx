"use client";
import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { useSelectedClub } from "@/lib/use-selected-club";
export function BookingWidgetSettings() {
  const { clubId, clubs } = useSelectedClub();
  const [message, setMessage] = useState("");
  if (!clubId) return null;
  const club = clubs.data?.items.find((item) => item.id === clubId);
  const origin =
    process.env.NEXT_PUBLIC_APPLICATION_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:7081"
      : "https://app.gym4me.ir");
  const src = new URL(`/embed/clubs/${encodeURIComponent(clubId)}`, origin)
    .href;
  const snippet = `<iframe src="${src.replaceAll('"', "&quot;")}" title="رزرو باشگاه" width="100%" height="600" style="border:0;border-radius:24px" loading="lazy"></iframe>`;
  return (
    <Card className="rounded-3xl p-5">
      <Card.Header>
        <Card.Title>رزرو از سایت باشگاه</Card.Title>
        <Card.Description>
          برنامه {club?.name} را در سایت خودت نمایش بده؛ مشتری برای نهایی‌کردن
          رزرو وارد اپ می‌شود.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <pre
          dir="ltr"
          className="overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-surface-secondary p-4 text-xs leading-6"
        >
          {snippet}
        </pre>
        <div className="flex flex-wrap gap-3">
          <Button
            onPress={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                setMessage("کد ویجت کپی شد.");
              } catch {
                setMessage("کپی خودکار نشد؛ کد بالا را انتخاب و کپی کنید.");
              }
            }}
          >
            کپی کد ویجت
          </Button>
          <a
            href={src}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center px-4 text-sm text-accent"
          >
            پیش‌نمایش
          </a>
        </div>
        {message && (
          <p role="status" className="text-xs">
            {message}
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
