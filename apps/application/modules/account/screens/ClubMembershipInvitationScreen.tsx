"use client";

import { Button, Card, toast } from "@heroui/react";
import { useDecideClubMembership } from "@api/business";
import { useRouter } from "next/navigation";

export function ClubMembershipInvitationScreen({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const decide = useDecideClubMembership();
  const submit = (decision: "accept" | "reject") => {
    void decide.mutateAsync({ membershipId, decision }).then(() => {
      toast.success(decision === "accept" ? "دعوت همکاری پذیرفته شد" : "دعوت رد شد");
      router.replace("/auth/roles");
    }).catch(() => toast.danger("این دعوت معتبر نیست یا قبلاً پاسخ داده شده است"));
  };
  return <main className="app-page grid min-h-dvh place-items-center"><Card className="app-card w-full max-w-sm rounded-3xl p-6 text-center shadow-none"><Card.Title>دعوت همکاری با باشگاه</Card.Title><p className="mt-3 text-sm leading-7 text-muted">با پذیرش دعوت، دسترسی تعیین‌شده توسط مدیر باشگاه به حساب شما اضافه می‌شود.</p><Button className="mt-6 w-full" variant="primary" isPending={decide.isPending} onPress={() => submit("accept")}>پذیرش دعوت</Button><Button className="mt-2 w-full" variant="danger-soft" isDisabled={decide.isPending} onPress={() => submit("reject")}>رد دعوت</Button></Card></main>;
}
