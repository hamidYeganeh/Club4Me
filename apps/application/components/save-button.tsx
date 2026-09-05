"use client";

import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { tokenStore, useToggleSave, type SavedEntityType } from "@api";
import { Icon } from "@theme/icon";

export function SaveButton({
  entityType,
  entityId,
}: {
  entityType: SavedEntityType;
  entityId: string;
}) {
  const router = useRouter();
  const saved = useToggleSave(entityType, entityId);
  return (
    <Button
      isIconOnly
      variant="secondary"
      aria-label={saved.active ? "حذف از ذخیره‌شده‌ها" : "ذخیره کردن"}
      aria-pressed={saved.active}
      isDisabled={!entityId || saved.isLoading}
      isPending={saved.mutation.isPending}
      onPress={() => {
        if (!tokenStore.get()) {
          router.push("/auth");
          return;
        }
        saved.mutation.mutate(undefined, {
          onError: () =>
            toast.danger("ذخیره تغییرات انجام نشد؛ دوباره تلاش کنید"),
        });
      }}
    >
      <Icon
        name="bookmark"
        size={22}
        className={saved.active ? "text-accent" : "text-muted"}
      />
    </Button>
  );
}
