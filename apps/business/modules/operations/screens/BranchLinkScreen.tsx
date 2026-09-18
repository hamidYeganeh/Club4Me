"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { useLinkBusinessBranches } from "@api/business";
import { useSelectedClub } from "@/lib/use-selected-club";

export function BranchLinkScreen({
  requestedClubId,
}: {
  requestedClubId?: string;
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const current = clubs.data?.items.find((club) => club.id === clubId);
  const candidates = (clubs.data?.items ?? []).filter(
    (club) =>
      club.isOwner &&
      club.id !== clubId &&
      club.branchGroupId !== current?.branchGroupId,
  );
  const [target, setTarget] = useState("");
  const link = useLinkBusinessBranches(clubId);
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/branches" className="text-sm text-accent">
          بازگشت به شعبه‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">اتصال شعبه</h1>
        <p className="mt-2 text-sm text-muted">
          دو باشگاه مستقل متعلق به شما به‌عنوان شعبه متصل می‌شوند و پرونده و
          برنامهٔ هر باشگاه جدا می‌ماند.
        </p>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <p className="text-sm">باشگاه فعلی: {current?.name ?? "—"}</p>
          <label className="mt-5 grid gap-2 text-sm">
            باشگاه دوم
            <FormSelect
              aria-label="باشگاه دوم"
              value={target}
              onChange={setTarget}
            >
              <FormOption value="">انتخاب باشگاه</FormOption>
              {candidates.map((club) => (
                <FormOption key={club.id} value={club.id}>
                  {club.name}
                </FormOption>
              ))}
            </FormSelect>
          </label>
          <div className="mt-5 flex gap-2">
            <Button
              variant="primary"
              isDisabled={!target || !current?.isOwner}
              isPending={link.isPending}
              onPress={async () => {
                try {
                  await link.mutateAsync(target);
                  toast.success("شعبه متصل شد");
                  router.push("/branches");
                } catch {
                  toast.danger("اتصال شعبه انجام نشد");
                }
              }}
            >
              اتصال
            </Button>
            <Button variant="ghost">
              <Link href="/branches">انصراف</Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
