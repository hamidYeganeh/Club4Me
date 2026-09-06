"use client";

import { useOffline } from "@api/offline/provider";

export function OfflineStatus() {
  const offline = useOffline();
  if (!offline || (!offline.pending && !offline.failed && !offline.unavailable))
    return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[900] mx-auto max-w-lg rounded-xl bg-surface px-4 py-3 text-center text-xs text-foreground shadow-lg"
    >
      {offline.unavailable
        ? "ذخیره‌سازی روی دستگاه در دسترس نیست؛ تغییرات آفلاین ذخیره نمی‌شوند."
        : offline.failed
          ? "ارسال بعضی تغییرات انجام نشد."
          : `${offline.pending.toLocaleString("fa-IR")} تغییر روی دستگاه ذخیره شده؛ در انتظار همگام‌سازی.`}
      {offline.failed > 0 && (
        <button className="mr-3 underline" onClick={offline.discardFailed}>
          کنار گذاشتن تغییرات ناموفق
        </button>
      )}
    </div>
  );
}
