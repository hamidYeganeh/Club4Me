"use client";
import { AppPageIntro } from "@/components/app-page-intro";

import { Button, Card, toast } from "@heroui/react";
import { useDecideClubMembership, useClubInvitation } from "@api/business";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { openExternalUrl } from "@/lib/native-browser";

export function ClubMembershipInvitationScreen({
  membershipId,
}: {
  membershipId: string;
}) {
  const decide = useDecideClubMembership();
  const invitation = useClubInvitation(membershipId);
  const submit = (decision: "accept" | "reject") => {
    void decide
      .mutateAsync({ membershipId, decision })
      .then(() => {
        toast.success(
          decision === "accept" ? "دعوت همکاری پذیرفته شد" : "دعوت رد شد",
        );
      })
      .catch(() =>
        toast.danger("این دعوت معتبر نیست یا قبلاً پاسخ داده شده است"),
      );
  };
  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="دعوت همکاری" showFilter={false} />
      <AppPageIntro page="invitation" />
      <Card className="app-card w-full max-w-sm rounded-3xl p-6 text-center shadow-none">
        <Card.Title>
          {invitation.data?.clubName
            ? `دعوت همکاری با ${invitation.data.clubName}`
            : "دعوت همکاری با باشگاه"}
        </Card.Title>
        {invitation.data && (
          <p className="mt-2 text-sm">
            نقش شما:{" "}
            {
              {
                owner: "مالک",
                manager: "مدیر",
                receptionist: "پذیرش",
                finance: "مالی",
                coach: "مربی",
              }[invitation.data.role]
            }
          </p>
        )}
        {invitation.isError && (
          <p role="alert">دعوت قابل دریافت نیست؛ حساب و لینک را بررسی کنید.</p>
        )}
        <p className="mt-3 text-sm leading-7 text-muted">
          با پذیرش دعوت، دسترسی تعیین‌شده توسط مدیر باشگاه به حساب شما اضافه
          می‌شود.
        </p>
        {invitation.data?.status === "accepted" && (
          <>
            <p className="mt-4 text-sm">
              همکاری فعال است. برای ورود به محیط پرسنل از همین موبایل استفاده
              کنید.
            </p>
            <Button
              className="mt-3 w-full"
              onPress={() =>
                void openExternalUrl("https://business.gym4me.ir").catch(() =>
                  toast.danger("باز کردن پنل انجام نشد"),
                )
              }
            >
              ورود به محیط پرسنل
            </Button>
          </>
        )}
        {invitation.data?.status === "suspended" && (
          <p className="mt-4 text-sm">این دسترسی توسط مالک لغو شده است.</p>
        )}
        {invitation.data?.status === "rejected" && (
          <p className="mt-4 text-sm">این دعوت رد شده است.</p>
        )}
        <Button
          className="mt-6 w-full"
          variant="primary"
          isPending={decide.isPending}
          isDisabled={
            invitation.isPending ||
            invitation.isError ||
            invitation.data?.status !== "invited"
          }
          onPress={() => submit("accept")}
        >
          پذیرش دعوت
        </Button>
        <Button
          className="mt-2 w-full"
          variant="danger-soft"
          isDisabled={
            decide.isPending ||
            invitation.isPending ||
            invitation.isError ||
            invitation.data?.status !== "invited"
          }
          onPress={() => submit("reject")}
        >
          رد دعوت
        </Button>
      </Card>
    </main>
  );
}
