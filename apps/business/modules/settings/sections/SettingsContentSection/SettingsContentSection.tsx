"use client";

import { useState } from "react";
import { Avatar, Button, Card, Input, Spinner, toast } from "@heroui/react";
import { useAccountMe, useUpdateAccountMe } from "@api/account";
import { useLogout } from "@api/business";
import { useCreateMedia } from "@api";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Uploader, imageUploaderAccept } from "@ui/uploader";
import { ButtonLink } from "@/components/button-link";

export function SettingsContentSection() {
  const account = useAccountMe();
  const update = useUpdateAccountMe();
  const logout = useLogout();
  const media = useCreateMedia();
  const router = useRouter();
  const t = useTranslations("uploader");
  const [draft, setDraft] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const user = account.data;
  if (account.isPending)
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner />
      </div>
    );
  if (!user || account.isError)
    return (
      <Card className="m-5 p-5">
        <p role="alert">دریافت حساب انجام نشد.</p>
        <Button onPress={() => void account.refetch()}>تلاش دوباره</Button>
      </Card>
    );
  const values = draft ?? {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
  };
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phone;
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-5" dir="rtl">
      <h1 className="text-2xl font-bold">تنظیمات حساب</h1>
      <Card className="rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <Avatar.Image src={user.avatarUrl} alt={name} />
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div>
            <Card.Title>{name}</Card.Title>
            <p dir="ltr" className="mt-2 text-start text-muted">
              {user.phone}
            </p>
          </div>
        </div>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (update.isPending) return;
            try {
              await update.mutateAsync(values);
              setDraft(null);
              toast.success("اطلاعات حساب ذخیره شد");
            } catch {
              toast.danger("ذخیره انجام نشد؛ دوباره تلاش کنید");
            }
          }}
        >
          <label className="grid gap-2">
            <span>نام</span>
            <Input
              className="w-full"
              aria-label="نام"
              required
              maxLength={100}
              value={values.firstName}
              onChange={(event) =>
                setDraft({ ...values, firstName: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2">
            <span>نام خانوادگی</span>
            <Input
              className="w-full"
              aria-label="نام خانوادگی"
              required
              maxLength={100}
              value={values.lastName}
              onChange={(event) =>
                setDraft({ ...values, lastName: event.target.value })
              }
            />
          </label>
          <p className="text-sm text-muted">
            شماره موبایل، شناسه ورود تأییدشده شماست.
          </p>
          <Button
            type="submit"
            variant="primary"
            isPending={update.isPending}
            isDisabled={!draft || media.isPending}
          >
            ذخیره اطلاعات
          </Button>
        </form>
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold">تصویر حساب</p>
          <Uploader
            multiple={false}
            disabled={media.isPending || update.isPending}
            accept={imageUploaderAccept}
            labels={{
              clickToUpload: t("clickToUpload"),
              dropHint: t("dropHint"),
              formats: t("formats"),
              progress: t("progress"),
              success: t("success"),
              error: t("error"),
              retry: t("retry"),
              remove: t("remove"),
              dropzoneAria: t("dropzoneAria"),
            }}
            onUpload={async (file) => {
              const uploaded = await media.mutateAsync(file);
              await update.mutateAsync({ avatarUrl: uploaded.url });
              toast.success("تصویر حساب ذخیره شد");
            }}
          />
        </div>
      </Card>
      <Card className="rounded-3xl p-5">
        <Card.Title>امور مالی</Card.Title>
        <p className="my-3 text-sm text-muted">
          حساب تسویه و درخواست‌های برداشت را در بخش پرداخت‌ها مدیریت کنید.
        </p>
        <ButtonLink href="/payments" variant="secondary">
          مدیریت پرداخت‌ها
        </ButtonLink>
      </Card>
      <Button
        variant="danger"
        isPending={logout.isPending}
        onPress={() =>
          void logout
            .mutateAsync()
            .then(() => router.replace("/auth"))
            .catch(() => toast.danger("خروج انجام نشد"))
        }
      >
        خروج از حساب
      </Button>
    </main>
  );
}
